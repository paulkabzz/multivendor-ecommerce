ALTER TABLE Product
    ADD COLUMN department_id UUID;

ALTER TABLE Product
    ADD CONSTRAINT product_department_id_fkey FOREIGN KEY(department_id) REFERENCES Department(department_id) ON DELETE CASCADE;

