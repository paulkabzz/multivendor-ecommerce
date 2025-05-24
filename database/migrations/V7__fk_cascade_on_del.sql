ALTER TABLE Category
    DROP CONSTRAINT IF EXISTS department_id_fkey;

ALTER TABLE Category
    ADD CONSTRAINT department_id_fkey 
        FOREIGN KEY (department_id) REFERENCES Department(department_id) ON DELETE CASCADE;

ALTER TABLE Product
    DROP CONSTRAINT IF EXISTS subcategory_fk;

ALTER TABLE Product
    ADD CONSTRAINT product_subcategory_id_fkey 
        FOREIGN KEY(subcategory_id) REFERENCES Subcategory(subcategory_id) ON DELETE CASCADE;

ALTER TABLE Subcategory
    DROP CONSTRAINT IF EXISTS subcategory_category_id_fkey;

ALTER TABLE Subcategory
    ADD CONSTRAINT subcategory_category_id_fkey 
        FOREIGN KEY(category_id) REFERENCES Category(category_id) ON DELETE CASCADE;

ALTER TABLE DepartmentCategory
    DROP CONSTRAINT IF EXISTS departmentcategory_department_id_fkey;

ALTER TABLE DepartmentCategory
    DROP CONSTRAINT IF EXISTS departmentcategory_category_id_fkey;

ALTER TABLE DepartmentCategory
    ADD CONSTRAINT departmentcategory_department_id_fkey 
        FOREIGN KEY(department_id) REFERENCES Department(department_id) ON DELETE CASCADE;

ALTER TABLE DepartmentCategory
    ADD CONSTRAINT departmentcategory_category_id_fkey 
        FOREIGN KEY(category_id) REFERENCES Category(category_id) ON DELETE CASCADE;

ALTER TABLE CategorySubcategory
    DROP CONSTRAINT IF EXISTS categorysubcategory_category_id_fkey;

ALTER TABLE CategorySubcategory
    DROP CONSTRAINT IF EXISTS categorysubcategory_subcategory_id_fkey;

ALTER TABLE CategorySubcategory
    ADD CONSTRAINT categorysubcategory_category_id_fkey 
        FOREIGN KEY(category_id) REFERENCES Category(category_id) ON DELETE CASCADE;

ALTER TABLE CategorySubcategory
    ADD CONSTRAINT categorysubcategory_subcategory_id_fkey 
        FOREIGN KEY(subcategory_id) REFERENCES Subcategory(subcategory_id) ON DELETE CASCADE;

