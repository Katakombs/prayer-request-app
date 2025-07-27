require('dotenv').config();
const Database = require('./database/Database');

async function migrateDatabase() {
  const db = new Database();
  
  try {
    console.log('Starting database migration...');
    
    // Check if prayed_for column exists
    const [columns] = await db.pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'prayers' 
      AND COLUMN_NAME = 'prayed_for'
    `);
    
    if (columns.length > 0) {
      console.log('Found prayed_for column, migrating to prayer_count...');
      
      // Add prayer_count column if it doesn't exist
      await db.pool.execute(`
        ALTER TABLE prayers 
        ADD COLUMN IF NOT EXISTS prayer_count INT DEFAULT 0
      `);
      
      // Update prayer_count based on existing prayed_for values
      await db.pool.execute(`
        UPDATE prayers 
        SET prayer_count = CASE WHEN prayed_for = TRUE THEN 1 ELSE 0 END
        WHERE prayer_count = 0
      `);
      
      // Drop the old prayed_for column
      await db.pool.execute(`
        ALTER TABLE prayers 
        DROP COLUMN prayed_for
      `);
      
      console.log('Successfully migrated prayed_for to prayer_count');
    } else {
      console.log('No prayed_for column found, migration not needed');
    }
    
    // Update index
    try {
      await db.pool.execute(`
        DROP INDEX IF EXISTS idx_prayers_prayed_for ON prayers
      `);
    } catch (error) {
      console.log('Index idx_prayers_prayed_for not found or already dropped');
    }
    
    try {
      await db.pool.execute(`
        CREATE INDEX idx_prayers_prayer_count ON prayers(prayer_count)
      `);
    } catch (error) {
      console.log('Index idx_prayers_prayer_count already exists');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };
