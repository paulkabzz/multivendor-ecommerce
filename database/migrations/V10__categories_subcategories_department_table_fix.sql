-- The linking tables will store the department id and category id
ALTER TABLE Category
    DROP COLUMN department_id;

ALTER TABLE Subcategory
    DROP COLUMN category_id;