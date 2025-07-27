# Prayer Request App

A simple web application for submitting and viewing prayer requests with email notifications.

## Features

- Submit prayer requests with optional name
- View all prayer requests
- **Prayer count tracking** - Click the prayer button to increment prayer count
- **Archived prayers view** - View completed prayers grouped by week
- Email notifications when new requests are submitted
- Spam protection with honeypot field

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure email notifications:
   - Copy `.env.example` to `.env`
   - Update the email configuration values in `.env`

3. **Run database migration** (if upgrading from previous version):
   ```bash
   node migrate.js
   ```

4. Start the application:
   ```bash
   npm start
   ```

## Email Configuration

To enable email notifications when new prayer requests are submitted:

1. Copy `.env.example` to `.env`
2. Configure your SMTP settings:
   - `SMTP_HOST`: Your email provider's SMTP server
   - `SMTP_PORT`: Usually 587 for TLS or 465 for SSL
   - `SMTP_USER`: Your email address
   - `SMTP_PASS`: Your email password or app-specific password
   - `NOTIFICATION_EMAIL`: Where to send notifications
   - `APP_NAME`: Name for your app (appears in emails)

**For Local Development:**
- Set `NODE_ENV=development` or `DISABLE_EMAIL=true` in your `.env` file to disable email sending
- Prayer requests will be logged to the console instead

### Gmail Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password: Google Account > Security > 2-Step Verification > App passwords
3. Use the App Password as `SMTP_PASS` (not your regular password)
4. Set `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`

### Other Email Providers

- **Outlook/Hotmail**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Check with your email provider

## Running the App

1. Visit `http://localhost:3000` to submit prayer requests
2. Visit `http://localhost:3000/requests` to view all requests and pray for them
3. Visit `http://localhost:3000/archived` to view archived prayers grouped by week
4. Check the designated notification email when new requests are submitted

## New Features

### Prayer Count System
- Instead of a simple checkbox, users now click a "Pray" button
- Each click increments the prayer count for that request
- Prayer counts are displayed prominently on each request

### Archived Prayers
- View completed/archived prayer requests at `/archived`
- Prayers are grouped by week for easy browsing
- Shows prayer counts and archiving information
- Accessible from the main requests page

## File Structure

- `app.js` - Main application server
- `views/` - EJS templates
- `public/` - Static assets
- `database/` - Database setup and connection
- `migrate.js` - Database migration script
- `.env` - Email configuration (create from .env.example)
