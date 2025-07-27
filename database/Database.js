const mysql = require('mysql2/promise');

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
  }

  async getAllPrayers() {
    const [rows] = await this.pool.execute(
      'SELECT * FROM prayers WHERE archived = FALSE ORDER BY created_at DESC'
    );
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      text: row.text,
      prayerCount: row.prayer_count,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));
  }

  async getArchivedPrayers() {
    const [rows] = await this.pool.execute(
      'SELECT * FROM prayers WHERE archived = TRUE ORDER BY archived_at DESC'
    );
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      text: row.text,
      prayerCount: row.prayer_count,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by
    }));
  }

  async getArchivedPrayersByWeek() {
    const [rows] = await this.pool.execute(`
      SELECT 
        *,
        YEARWEEK(archived_at, 0) as week_number,
        DATE_FORMAT(DATE_SUB(archived_at, INTERVAL WEEKDAY(archived_at) DAY), '%Y-%m-%d') as week_start,
        DATE_FORMAT(DATE_ADD(DATE_SUB(archived_at, INTERVAL WEEKDAY(archived_at) DAY), INTERVAL 6 DAY), '%Y-%m-%d') as week_end
      FROM prayers 
      WHERE archived = TRUE 
      ORDER BY archived_at DESC
    `);
    
    const groupedPrayers = {};
    rows.forEach(row => {
      const weekKey = row.week_number;
      if (!groupedPrayers[weekKey]) {
        groupedPrayers[weekKey] = {
          weekNumber: row.week_number,
          weekStart: row.week_start,
          weekEnd: row.week_end,
          prayers: []
        };
      }
      
      groupedPrayers[weekKey].prayers.push({
        id: row.id,
        name: row.name,
        text: row.text,
        prayerCount: row.prayer_count,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
        archivedBy: row.archived_by
      });
    });
    
    return Object.values(groupedPrayers).sort((a, b) => b.weekNumber - a.weekNumber);
  }

  async createPrayer(prayer) {
    const { id, name, text } = prayer;
    await this.pool.execute(
      'INSERT INTO prayers (id, name, text, prayer_count, created_at) VALUES (?, ?, ?, 0, NOW())',
      [id, name, text]
    );
    return prayer;
  }

  async incrementPrayerCount(id) {
    await this.pool.execute(
      'UPDATE prayers SET prayer_count = prayer_count + 1, updated_at = NOW() WHERE id = ?',
      [id]
    );
  }

  async updatePrayerCount(id, count) {
    await this.pool.execute(
      'UPDATE prayers SET prayer_count = ?, updated_at = NOW() WHERE id = ?',
      [count, id]
    );
  }

  async archivePrayer(id, archivedBy) {
    await this.pool.execute(
      'UPDATE prayers SET archived = TRUE, archived_at = NOW(), archived_by = ? WHERE id = ?',
      [archivedBy, id]
    );
  }

  async unarchivePrayer(id) {
    await this.pool.execute(
      'UPDATE prayers SET archived = FALSE, archived_at = NULL, archived_by = NULL WHERE id = ?',
      [id]
    );
  }

  async deletePrayer(id) {
    await this.pool.execute('DELETE FROM prayers WHERE id = ?', [id]);
  }

  async close() {
    await this.pool.end();
  }

  // Migration function to import existing JSON data
  async importFromJSON(jsonData) {
    const prayers = Array.isArray(jsonData) ? jsonData : [];
    
    for (const prayer of prayers) {
      try {
        // Convert old prayedFor boolean to prayer count
        const prayerCount = prayer.prayedFor ? 1 : 0;
        
        await this.pool.execute(
          'INSERT INTO prayers (id, name, text, prayer_count, created_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
          [
            prayer.id,
            prayer.name || 'Anonymous',
            prayer.text,
            prayerCount,
            new Date(prayer.createdAt)
          ]
        );
      } catch (error) {
        console.error('Error importing prayer:', prayer.id, error.message);
      }
    }
  }
}

module.exports = Database;
