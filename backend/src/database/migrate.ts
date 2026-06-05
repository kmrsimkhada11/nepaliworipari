import pool from '../config/database';

const migrate = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create categories table with parent_id for hierarchy
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        icon VARCHAR(50),
        description TEXT,
        parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
    `);

    // Create users table for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'seeker',
        phone VARCHAR(20),
        state VARCHAR(3),
        city VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Create businesses table with lat/lng for geolocation
    await client.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        state VARCHAR(3) NOT NULL,
        city VARCHAR(100),
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        description TEXT,
        image_url VARCHAR(500),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add user_id column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_state ON businesses(state);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_state_category ON businesses(state, category_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(latitude, longitude);
    `);

    // Create reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_business ON reviews(user_id, business_id);
    `);

    // Create messages table for chat
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id VARCHAR(100) NOT NULL,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_id INTEGER,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Drop the foreign key on business_id if it exists (to allow service post IDs)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_business_id_fkey;
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$;
    `);

    // Create conversations table to track acceptance status
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(100) PRIMARY KEY,
        initiator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, is_read);
    `);

    // Create service_requests table to track services taken
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_service_requests_business ON service_requests(business_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_service_requests_seeker ON service_requests(seeker_id);
    `);

    // Create service_posts table (seekers post what they need)
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_posts (
        id SERIAL PRIMARY KEY,
        seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        state VARCHAR(3) NOT NULL,
        city VARCHAR(100),
        budget VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_service_posts_seeker ON service_posts(seeker_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_service_posts_status ON service_posts(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_service_posts_category ON service_posts(category_id);
    `);

    // Add reply_to_id column for message replies
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // Add social media columns if they don't exist
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS facebook VARCHAR(255);
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tiktok VARCHAR(255);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully (non-destructive)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
