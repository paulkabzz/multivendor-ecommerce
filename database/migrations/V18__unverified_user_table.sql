CREATE TABLE UnverifiedUsers (
    user_id UUID NOT NULL UNIQUE PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    otp INTEGER NOT NULL
);