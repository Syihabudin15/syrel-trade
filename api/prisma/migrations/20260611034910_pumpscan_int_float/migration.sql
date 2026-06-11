/*
  Warnings:

  - You are about to alter the column `open` on the `pumpscanner` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `sl` on the `pumpscanner` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `tp` on the `pumpscanner` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `pumpscanner` MODIFY `open` DOUBLE NOT NULL,
    MODIFY `sl` DOUBLE NOT NULL,
    MODIFY `tp` DOUBLE NOT NULL;
