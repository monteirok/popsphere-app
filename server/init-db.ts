import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  console.log('Creating missing tables...');

  // Create notifications table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        source_id INTEGER,
        source_type TEXT,
        actor_id INTEGER REFERENCES users(id),
        read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Notifications table created or already exists');
  } catch (error) {
    console.error('Error creating notifications table:', error);
  }

  // Create chat_messages table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Chat messages table created or already exists');
  } catch (error) {
    console.error('Error creating chat_messages table:', error);
  }

  console.log('Database initialization completed');
  await pool.end();
}

main().catch(console.error);