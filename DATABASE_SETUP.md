# Database Setup Guide

## Prerequisites
- MAMP running locally with MySQL/MariaDB
- Database access credentials

## Setup Steps

### 1. Create Database (Local - MAMP)
1. Open phpMyAdmin (usually at http://localhost/phpMyAdmin)
2. Create a new database called `prayer_requests`
3. Run the SQL script from `database/setup.sql` in the new database

### 2. Create Database (Production - MariaDB)
1. Connect to your MariaDB server
2. Run the SQL script from `database/setup.sql`

### 3. Update Environment Variables
Update your `.env` file with your database credentials:

**For MAMP (Local):**
```
DB_HOST=localhost
DB_PORT=8889
DB_USER=root
DB_PASS=root
DB_NAME=prayer_requests
```

**For Production:**
```
DB_HOST=your-production-server.com
DB_PORT=3306
DB_USER=phazeshi_grcofc
DB_PASS=tiwkis-sunvyf-Hifjo7
DB_NAME=phazeshi_prayer_requests
```

### 4. Migration (Optional)
If you have existing prayer data in `db/prayers.json`:
```bash
npm run migrate
```

This will:
- Import all existing prayers to the database
- Create a backup of your JSON file
- Preserve all prayer data and timestamps

### 5. Admin Access
Default admin credentials (change these in `.env`):
- Username: `admin`
- Password: `prayer_admin_2025`

Access admin at: `http://localhost:3000/admin`

## Admin Features

- **View all active prayers** with statistics
- **Archive prayers** (removes from public view but keeps in database)
- **Unarchive prayers** (returns to public view)
- **Delete prayers** (permanently removes from database)
- **View archived prayers** with archive history

## Database Schema

### `prayers` table:
- `id` - UUID primary key
- `name` - Prayer requester name (default: 'Anonymous')
- `text` - Prayer request text
- `prayed_for` - Boolean (has been prayed for)
- `archived` - Boolean (hidden from public view)
- `created_at` - Timestamp when created
- `updated_at` - Timestamp when last modified
- `archived_at` - Timestamp when archived
- `archived_by` - Username who archived it

## Security Notes

- Change default admin credentials in production
- Use strong session secret
- Consider using hashed passwords for admin accounts
- Keep `.env` file secure and never commit to version control
