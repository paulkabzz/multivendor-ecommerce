-- We'll link the image to the prodcyt via the Image relation
ALTER TABLE Product 
    DROP COLUMN image_url;