-- CreateEnum
CREATE TYPE "role" AS ENUM ('CUSTOMER', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "status" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "condition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'BAD');

-- CreateTable
CREATE TABLE "FlywayHistory" (
    "installed_rank" INTEGER NOT NULL,
    "version" VARCHAR(50),
    "description" VARCHAR(200) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "script" VARCHAR(1000) NOT NULL,
    "checksum" INTEGER,
    "installed_by" VARCHAR(100) NOT NULL,
    "installed_on" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "execution_time" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,

    CONSTRAINT "FlywayHistory_pk" PRIMARY KEY ("installed_rank")
);

-- CreateTable
CREATE TABLE "image" (
    "image_id" UUID NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "product_id" UUID NOT NULL,

    CONSTRAINT "image_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "orderitem" (
    "order_item_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quantity" INTEGER DEFAULT 1,

    CONSTRAINT "orderitem_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "status" DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "product" (
    "product_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "decsription" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "condition" "condition",
    "is_available" BOOLEAN DEFAULT true,
    "subcategory_id" UUID,
    "size_id" UUID,
    "brand_id" UUID,
    "department_id" UUID,

    CONSTRAINT "product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(60) NOT NULL,
    "last_name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "role" "role" DEFAULT 'CUSTOMER',
    "phone" VARCHAR(20),
    "is_verified" BOOLEAN DEFAULT false,
    "avatar_url" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "vendor" (
    "vendor_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_name" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "avatar_url" VARCHAR(255),
    "last_active" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ig_username" VARCHAR(30),

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("vendor_id")
);

-- CreateTable
CREATE TABLE "category" (
    "category_id" UUID NOT NULL,
    "category_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "categorysubcategory" (
    "category_id" UUID NOT NULL,
    "subcategory_id" UUID NOT NULL,

    CONSTRAINT "categorysubcategory_pkey" PRIMARY KEY ("category_id","subcategory_id")
);

-- CreateTable
CREATE TABLE "department" (
    "department_id" UUID NOT NULL,
    "department_name" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255),

    CONSTRAINT "department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "departmentcategory" (
    "department_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "departmentcategory_pkey" PRIMARY KEY ("department_id","category_id")
);

-- CreateTable
CREATE TABLE "subcategory" (
    "subcategory_id" UUID NOT NULL,
    "subcategory_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "subcategory_pkey" PRIMARY KEY ("subcategory_id")
);

-- CreateTable
CREATE TABLE "tokenblacklist" (
    "token_id" UUID NOT NULL,
    "token_jti" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokenblacklist_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "brands" (
    "brand_id" UUID NOT NULL,
    "brand_name" VARCHAR(64),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("brand_id")
);

-- CreateTable
CREATE TABLE "sizes" (
    "size_id" UUID NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "size_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sizes_pkey" PRIMARY KEY ("size_id")
);

-- CreateIndex
CREATE INDEX "FlywayHistory_s_idx" ON "FlywayHistory"("success");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "u_user_id" ON "vendor"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_ig_username_key" ON "vendor"("ig_username");

-- CreateIndex
CREATE UNIQUE INDEX "category_category_name_key" ON "category"("category_name");

-- CreateIndex
CREATE UNIQUE INDEX "department_department_name_key" ON "department"("department_name");

-- CreateIndex
CREATE UNIQUE INDEX "tokenblacklist_token_jti_key" ON "tokenblacklist"("token_jti");

-- CreateIndex
CREATE INDEX "idx_sizes_category" ON "sizes"("category");

-- CreateIndex
CREATE INDEX "idx_sizes_category_size" ON "sizes"("category", "size_name");

-- CreateIndex
CREATE INDEX "idx_sizes_size_name" ON "sizes"("size_name");

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderitem" ADD CONSTRAINT "orderitem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderitem" ADD CONSTRAINT "orderitem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderitem" ADD CONSTRAINT "orderitem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "fk_brand_id" FOREIGN KEY ("brand_id") REFERENCES "brands"("brand_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "fk_size_id" FOREIGN KEY ("size_id") REFERENCES "sizes"("size_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "subcategory_fk" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("subcategory_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("vendor_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorysubcategory" ADD CONSTRAINT "categorysubcategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorysubcategory" ADD CONSTRAINT "categorysubcategory_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("subcategory_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departmentcategory" ADD CONSTRAINT "departmentcategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departmentcategory" ADD CONSTRAINT "departmentcategory_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;
