require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const nodemailer = require('nodemailer');
const Database = require('./database/Database');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports like 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Function to send email notification
async function sendPrayerNotification(prayer) {
  // Disable email sending for local development
  if (process.env.NODE_ENV === 'development' || process.env.DISABLE_EMAIL === 'true') {
    console.log('Email sending disabled for local development');
    console.log('Prayer request received:', {
      from: prayer.name,
      text: prayer.text,
      submitted: new Date(prayer.createdAt).toLocaleString()
    });
    return;
  }

  if (!process.env.SMTP_USER || !process.env.NOTIFICATION_EMAIL) {
    console.log('Email configuration not complete. Skipping notification.');
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `New Prayer Request - ${process.env.APP_NAME || 'Prayer App'}`,
    html: `
      <h2>New Prayer Request Received</h2>
      <p><strong>From:</strong> ${prayer.name}</p>
      <p><strong>Submitted:</strong> ${new Date(prayer.createdAt).toLocaleString()}</p>
      <p><strong>Request:</strong></p>
      <blockquote style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
        ${prayer.text}
      </blockquote>
      <p><em>This notification was sent automatically from ${process.env.APP_NAME || 'Prayer Request App'}.</em></p>
    `,
    text: `
New Prayer Request Received

From: ${prayer.name}
Submitted: ${new Date(prayer.createdAt).toLocaleString()}
Request: ${prayer.text}

This notification was sent automatically from ${process.env.APP_NAME || 'Prayer Request App'}.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Prayer request notification sent successfully');
  } catch (error) {
    console.error('Error sending prayer request notification:', error);
  }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration for admin
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-default-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Admin authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  } else {
    return res.redirect('/admin/login');
  }
}

// Public routes
app.get('/', (req, res) => {
  res.render('index', { currentPage: 'submit' });
});

app.get('/requests', async (req, res) => {
  try {
    const prayers = await db.getAllPrayers();
    res.render('requests', { prayers, currentPage: 'view' });
  } catch (error) {
    console.error('Error fetching prayers:', error);
    res.status(500).send('Error loading prayer requests');
  }
});

app.get('/archived', async (req, res) => {
  try {
    const archivedPrayersByWeek = await db.getArchivedPrayersByWeek();
    res.render('archived', { archivedPrayersByWeek, currentPage: 'archived' });
  } catch (error) {
    console.error('Error fetching archived prayers:', error);
    res.status(500).send('Error loading archived prayers');
  }
});

app.post('/api/prayer', async (req, res) => {
  const { text, name, nickname, timestamp } = req.body;
  
  // Enhanced spam protection
  
  // 1. Honeypot check
  if (nickname) {
    console.log('Spam detected: honeypot field filled');
    return res.status(400).send('Bot detected');
  }
  
  // 2. Basic validation
  if (!text || text.trim() === '') {
    return res.status(400).send('Prayer request text is required');
  }
  
  // 3. Length validation
  const cleanText = text.trim();
  if (cleanText.length < 10) {
    return res.status(400).send('Prayer request must be at least 10 characters');
  }
  if (cleanText.length > 2000) {
    return res.status(400).send('Prayer request must be less than 2000 characters');
  }
  
  // 4. Rate limiting check (must wait at least 3 seconds from page load)
  if (timestamp) {
    const submissionTime = Date.now();
    const pageLoadTime = parseInt(timestamp);
    const timeDiff = submissionTime - pageLoadTime;
    
    if (timeDiff < 3000) { // Less than 3 seconds
      console.log('Spam detected: submission too fast');
      return res.status(429).send('Please wait before submitting');
    }
  }
  
  // 5. Content filtering for spam patterns
  const spamPatterns = [
    /http[s]?:\/\/[^\s]+/gi,  // URLs
    /www\.[^\s]+/gi,          // Website references
    /\b(buy|sell|cheap|free|money|cash|loan|credit|viagra|casino|lottery|winner)\b/gi,
    /(.)\1{10,}/g,            // Repeated characters
    /<[^>]*>/g,               // HTML tags
    /\b\d{10,}\b/g            // Long number sequences (likely phone numbers)
  ];
  
  for (let pattern of spamPatterns) {
    if (pattern.test(cleanText)) {
      console.log('Spam detected: suspicious content pattern');
      return res.status(400).send('Prayer request contains inappropriate content');
    }
  }
  
  // 6. Time-based rate limiting (per session, not IP)
  if (timestamp) {
    const submissionTime = Date.now();
    const pageLoadTime = parseInt(timestamp);
    const timeDiff = submissionTime - pageLoadTime;
    
    // Require at least 5 seconds from page load to prevent rapid automated submissions
    if (timeDiff < 5000) {
      console.log('Spam detected: submission too fast');
      return res.status(429).send('Please wait before submitting');
    }
  }
  
  const newPrayer = {
    id: uuidv4(),
    text: cleanText,
    name: name && name.trim() ? name.trim() : 'Anonymous',
    prayedFor: false,
    createdAt: new Date().toISOString()
  };
  
  try {
    await db.createPrayer(newPrayer);
    
    // Send email notification
    await sendPrayerNotification(newPrayer);
    
    res.redirect('/requests');
  } catch (error) {
    console.error('Error creating prayer:', error);
    res.status(500).send('Error submitting prayer request');
  }
});

app.post('/api/prayer/:id/pray', async (req, res) => {
  try {
    await db.incrementPrayerCount(req.params.id);
    res.redirect('/requests');
  } catch (error) {
    console.error('Error incrementing prayer count:', error);
    res.status(500).send('Error updating prayer count');
  }
});

app.post('/api/prayer/:id/prayed', async (req, res) => {
  try {
    const prayers = await db.getAllPrayers();
    const prayer = prayers.find(p => p.id === req.params.id);
    if (prayer) {
      await db.updatePrayedFor(req.params.id, !prayer.prayedFor);
    }
    res.redirect('/requests');
  } catch (error) {
    console.error('Error updating prayer status:', error);
    res.status(500).send('Error updating prayer status');
  }
});

app.get('/api/prayer', async (req, res) => {
  try {
    const prayers = await db.getAllPrayers();
    res.json(prayers);
  } catch (error) {
    console.error('Error fetching prayers:', error);
    res.status(500).json({ error: 'Error fetching prayers' });
  }
});

// Admin routes
app.get('/admin/login', (req, res) => {
  res.render('admin-login', { error: null });
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Simple authentication - in production, use hashed passwords
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    req.session.username = username;
    res.redirect('/admin');
  } else {
    res.render('admin-login', { error: 'Invalid credentials' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

app.get('/admin', requireAuth, async (req, res) => {
  try {
    const activePrayers = await db.getAllPrayers();
    const archivedPrayers = await db.getArchivedPrayers();
    res.render('admin-dashboard', {
      username: req.session.username,
      currentView: 'active',
      currentPage: 'admin',
      activePrayers,
      archivedPrayers
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

app.get('/admin/archived', requireAuth, async (req, res) => {
  try {
    const activePrayers = await db.getAllPrayers();
    const archivedPrayersByWeek = await db.getArchivedPrayersByWeek();
    res.render('admin-dashboard', {
      username: req.session.username,
      currentView: 'archived',
      currentPage: 'admin',
      activePrayers,
      archivedPrayersByWeek
    });
  } catch (error) {
    console.error('Error loading archived prayers:', error);
    res.status(500).send('Error loading archived prayers');
  }
});

app.post('/admin/archive/:id', requireAuth, async (req, res) => {
  try {
    await db.archivePrayer(req.params.id, req.session.username);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error archiving prayer:', error);
    res.status(500).send('Error archiving prayer');
  }
});

app.post('/admin/unarchive/:id', requireAuth, async (req, res) => {
  try {
    await db.unarchivePrayer(req.params.id);
    res.redirect('/admin/archived');
  } catch (error) {
    console.error('Error unarchiving prayer:', error);
    res.status(500).send('Error unarchiving prayer');
  }
});

app.post('/admin/delete/:id', requireAuth, async (req, res) => {
  try {
    await db.deletePrayer(req.params.id);
    res.redirect('back');
  } catch (error) {
    console.error('Error deleting prayer:', error);
    res.status(500).send('Error deleting prayer');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

app.listen(PORT, () => console.log(`Prayer app running on http://localhost:${PORT}`));
