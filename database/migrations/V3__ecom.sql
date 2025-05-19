CREATE TYPE CONDITION AS ENUM (
    'NEW',
    'LIKE_NEW',
    'GOOD',
    'FAIR',
    'BAD'
);

CREATE TYPE CATEGORY AS ENUM (
    'BOOKS',
    'ELECTRONICS',
    'CLOTHING',
    'FURNITURE',
    'GROCERIES',
    'STATIONERY',
    'HEALTH_AND_BEAUTY',
    'SPORTS_AND_OUTDOORS',
    'CAMPUS_MERCH',
    'EVENT_TICKETS',
    'PRINTING_SERVICES',
    'FOOD_AND_DRINKS',
    'TEXTBOOKS',
    'ART_SUPPLIES',
    'LAB_EQUIPMENT',
    'ACCESSORIES',
    'OTHER'
);

ALTER TABLE Vendor 
    DROP CONSTRAINT vendor_user_id_key;

ALTER TABLE Product
    DROP CONSTRAINT product_vendor_id_key;

ALTER TABLE Product
    ADD COLUMN condition CONDITION;

ALTER TABLE Product
    ADD COLUMN category CATEGORY;

ALTER TABLE Product
    ADD COLUMN is_available BOOLEAN DEFAULT TRUE;

ALTER TABLE Image
    DROP CONSTRAINT image_product_id_key;

ALTER TABLE Orders
    DROP CONSTRAINT orders_user_id_key;

ALTER TABLE OrderItem
    DROP CONSTRAINT orderitem_order_id_key;

ALTER TABLE OrderItem
    DROP CONSTRAINT orderitem_product_id_key;

ALTER TABLE OrderItem
    DROP CONSTRAINT orderitem_user_id_key;

ALTER TABLE Cart
    DROP CONSTRAINT cart_user_id_key;

ALTER TABLE Cart
    DROP CONSTRAINT cart_product_id_key;

ALTER TABLE Users
    ADD COLUMN phone VARCHAR(20);

ALTER TABLE Users
    ADD CONSTRAINT valid_uct_email 
    CHECK (email ~* '^[a-zA-Z]{6}[0-9]{3}@myuct\.ac\.za$');

ALTER TABLE Users
    ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE Users
    ALTER COLUMN password TYPE VARCHAR(64);
    
ALTER TABLE Users
    RENAME craeted_at TO created_at;
