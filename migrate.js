require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('./database/Database');

async function migrateJSONToDB() {
  const db = new Database();
  const jsonFile = path.join(__dirname, 'db', 'prayers.json');
  
  try {
    if (fs.existsSync(jsonFile)) {
      console.log('Reading existing prayers.json file...');
      const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      
      console.log(`Found ${jsonData.length} prayers to migrate...`);
      await db.importFromJSON(jsonData);
      
      console.log('Migration completed successfully!');
      
      // Backup the JSON file
      const backupFile = path.join(__dirname, 'db', `prayers-backup-${Date.now()}.json`);
      fs.copyFileSync(jsonFile, backupFile);
      console.log(`JSON file backed up to: ${backupFile}`);
      
    } else {
      console.log('No prayers.json file found. Starting with empty database.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  migrateJSONToDB();
}

module.exports = migrateJSONToDB;
