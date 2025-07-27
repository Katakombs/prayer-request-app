require('dotenv').config();
const Database = require('./database/Database');

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DB Config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
  });
  
  const db = new Database();
  
  try {
    const prayers = await db.getAllPrayers();
    console.log('✅ Database connection successful!');
    console.log(`Found ${prayers.length} prayers in database`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await db.close();
  }
}

testConnection();
