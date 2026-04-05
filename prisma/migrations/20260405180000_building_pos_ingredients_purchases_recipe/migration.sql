-- CreateTable
CREATE TABLE `building_pos_ingredients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `name` VARCHAR(160) NOT NULL,
    `unit_label` VARCHAR(32) NOT NULL DEFAULT '',
    `sort_order` INTEGER NOT NULL DEFAULT 100,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `bpos_ing_owner_trial_sort_idx`(`owner_id`, `trial_session_id`, `sort_order`),
    INDEX `bpos_ing_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `building_pos_purchase_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `purchased_on` DATE NOT NULL,
    `note` VARCHAR(500) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bpos_po_owner_trial_date_idx`(`owner_id`, `trial_session_id`, `purchased_on`),
    INDEX `bpos_po_owner_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `building_pos_purchase_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_order_id` INTEGER NOT NULL,
    `ingredient_id` INTEGER NOT NULL,
    `quantity` DECIMAL(14, 4) NOT NULL,
    `unit_price_baht` DECIMAL(12, 2) NOT NULL,

    INDEX `bpos_pl_po_idx`(`purchase_order_id`),
    INDEX `bpos_pl_ing_idx`(`ingredient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `building_pos_menu_recipe_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `menu_item_id` INTEGER NOT NULL,
    `ingredient_id` INTEGER NOT NULL,
    `qty_per_portion` DECIMAL(14, 4) NOT NULL,

    UNIQUE INDEX `bpos_recipe_menu_ing_uniq`(`menu_item_id`, `ingredient_id`),
    INDEX `bpos_recipe_menu_idx`(`menu_item_id`),
    INDEX `bpos_recipe_ing_idx`(`ingredient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `building_pos_ingredients` ADD CONSTRAINT `building_pos_ingredients_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `building_pos_purchase_orders` ADD CONSTRAINT `building_pos_purchase_orders_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `building_pos_purchase_lines` ADD CONSTRAINT `building_pos_purchase_lines_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `building_pos_purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `building_pos_purchase_lines` ADD CONSTRAINT `building_pos_purchase_lines_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `building_pos_ingredients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `building_pos_menu_recipe_lines` ADD CONSTRAINT `building_pos_menu_recipe_lines_menu_item_id_fkey` FOREIGN KEY (`menu_item_id`) REFERENCES `building_pos_menu_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `building_pos_menu_recipe_lines` ADD CONSTRAINT `building_pos_menu_recipe_lines_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `building_pos_ingredients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
