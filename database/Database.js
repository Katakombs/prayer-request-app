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
      prayedFor: Boolean(row.prayed_for),
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
      prayedFor: Boolean(row.prayed_for),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by
    }));
  }

  async createPrayer(prayer) {
    const { id, name, text } = prayer;
    await this.pool.execute(
      'INSERT INTO prayers (id, name, text, prayed_for, created_at) VALUES (?, ?, ?, FALSE, NOW())',
      [id, name, text]
    );
    return prayer;
  }

  async updatePrayedFor(id, prayedFor) {
    await this.pool.execute(
      'UPDATE prayers SET prayed_for = ?, updated_at = NOW() WHERE id = ?',
      [prayedFor, id]
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
        await this.pool.execute(
          'INSERT INTO prayers (id, name, text, prayed_for, created_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
          [
            prayer.id,
            prayer.name || 'Anonymous',
            prayer.text,
            prayer.prayedFor || false,
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
