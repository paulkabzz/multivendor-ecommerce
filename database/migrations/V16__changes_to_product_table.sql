CREATE TABLE IF NOT EXISTS Size (
    size_id PRIMARY KEY UUID DEFAULT generate_uuid_v4(),
)

ALTER TABLE Products
    ADD COLUMN product_size 