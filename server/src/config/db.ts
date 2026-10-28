import 'dotenv/config'
import pg from 'pg'

export const pool = new pg.Pool({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }),
  connectionTimeoutMillis: 5000,
})

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
      password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settlement_audit (
      id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_id uuid NOT NULL, evidence jsonb NOT NULL, before_data jsonb NOT NULL,
      after_data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS bets (
      id uuid NOT NULL, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS bets_source_hash_unique ON bets(user_id, (data->>'sourceHash')) WHERE data->>'sourceHash' IS NOT NULL;
  `)
}
