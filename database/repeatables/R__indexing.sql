-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);

-- Vendor table indexes
CREATE INDEX IF NOT EXISTS idx_vendor_user_id ON Vendor(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_store_name ON Vendor(store_name);

-- Product table indexes
CREATE INDEX IF NOT EXISTS idx_product_vendor_id ON Product(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_subcategory_id ON Product(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_product_price ON Product(price);
CREATE INDEX IF NOT EXISTS idx_product_name ON Product(name);
CREATE INDEX IF NOT EXISTS idx_product_created_at ON Product(created_at);
CREATE INDEX IF NOT EXISTS idx_product_is_available ON Product(is_available);
CREATE INDEX IF NOT EXISTS idx_product_condition ON Product(condition);

-- Composite index for product filtering (common query pattern)
CREATE INDEX IF NOT EXISTS idx_product_subcat_price ON Product(subcategory_id, price);
CREATE INDEX IF NOT EXISTS idx_product_available_price ON Product(is_available, price);

-- Order table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON Orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON Orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON Orders(created_at);

-- OrderItem table indexes
CREATE INDEX IF NOT EXISTS idx_orderitem_order_id ON OrderItem(order_id);
CREATE INDEX IF NOT EXISTS idx_orderitem_product_id ON OrderItem(product_id);
CREATE INDEX IF NOT EXISTS idx_orderitem_user_id ON OrderItem(user_id);

-- Image table indexes
CREATE INDEX IF NOT EXISTS idx_image_product_id ON Image(product_id);

-- Category, Department, Subcategory indexes
CREATE INDEX IF NOT EXISTS idx_category_department_id ON Category(department_id);
CREATE INDEX IF NOT EXISTS idx_category_name ON Category(category_name);
CREATE INDEX IF NOT EXISTS idx_subcategory_category_id ON Subcategory(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategory_name ON Subcategory(subcategory_name);
CREATE INDEX IF NOT EXISTS idx_department_name ON Department(department_name);

-- Linking table indexes (though these usually rely on primary key indexes)
CREATE INDEX IF NOT EXISTS idx_deptcat_department_id ON DepartmentCategory(department_id);
CREATE INDEX IF NOT EXISTS idx_deptcat_category_id ON DepartmentCategory(category_id);
CREATE INDEX IF NOT EXISTS idx_catsubcat_category_id ON CategorySubcategory(category_id);
CREATE INDEX IF NOT EXISTS idx_catsubcat_subcategory_id ON CategorySubcategory(subcategory_id);