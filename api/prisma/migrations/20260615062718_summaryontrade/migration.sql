/*
  Warnings:

  - You are about to drop the column `follow_bot` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `botlog` MODIFY `reason` TEXT NULL;

-- AlterTable
ALTER TABLE `trade` ADD COLUMN `summary` TEXT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `follow_bot`;

-- CreateTable
CREATE TABLE `UserSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `start_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `end_at` DATETIME(3) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `max_bot` INTEGER NOT NULL,
    `description` TEXT NULL,
    `benefit` TEXT NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
