ALTER TABLE Users
    RENAME COLUMN profile_pic_url TO avatar_url;

ALTER TABLE Vendor
    RENAME COLUMN image_url TO avatar_url;