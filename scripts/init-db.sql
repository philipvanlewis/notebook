-- Initialize pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create additional extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE notebook TO notebook;
