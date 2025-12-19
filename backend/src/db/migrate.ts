import { pool } from './connection.js';

async function migrate() {
  try {
    console.log('Running database migrations...');

    // Create items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Created items table');

    // Create update trigger for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_items_updated_at ON items;
    `);

    await pool.query(`
      CREATE TRIGGER update_items_updated_at
      BEFORE UPDATE ON items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✓ Created update triggers');

    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

