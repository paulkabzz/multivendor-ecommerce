-- DROP CATEGORIES ENUM --

ALTER TABLE Product 
    DROP COLUMN category;

DROP TYPE CATEGORY;

CREATE TABLE IF NOT EXISTS Department (
    department_id UUID PRIMARY KEY NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    department_name varchar(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Category (
    category_id UUID UNIQUE NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(255) NOT NULL UNIQUE,
    department_id UUID,
    FOREIGN KEY(department_id) REFERENCES Department(department_id)
);

CREATE TABLE IF NOT EXISTS Subcategory (
    subcategory_id UUID UNIQUE NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    subcategory_name VARCHAR(255) NOT NULL,
    category_id UUID,
    FOREIGN KEY(category_id) REFERENCES Category(category_id)
);

-- Linking Tables --

-- Many Categories can belong to many Departments

CREATE TABLE DepartmentCategory (
    department_id UUID,
    category_id UUID,
    PRIMARY KEY(department_id, category_id),
    FOREIGN KEY(department_id) REFERENCES Department(department_id),
    FOREIGN KEY(category_id) REFERENCES Category(category_id)
);

-- Many Subcategories can belong to many Categories

CREATE TABLE CategorySubcategory (
    category_id UUID,
    subcategory_id UUID,
    PRIMARY KEY(category_id, subcategory_id),
    FOREIGN KEY(category_id) REFERENCES Category(category_id),
    FOREIGN KEY(subcategory_id) REFERENCES Subcategory(subcategory_id)
);

-- Store Category ID Instead --

ALTER TABLE Product
    ADD COLUMN subcategory_id UUID;

ALTER TABLE Product
    ADD CONSTRAINT subcategory_fk FOREIGN KEY(subcategory_id) REFERENCES Subcategory(subcategory_id);