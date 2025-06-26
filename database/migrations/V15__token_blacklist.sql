CREATE TABLE IF NOT EXISTS TokenBlacklist (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_jti TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);