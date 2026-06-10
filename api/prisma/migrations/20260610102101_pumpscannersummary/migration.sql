/*
  Warnings:

  - You are about to drop the column `size` on the `pumpscanner` table. All the data in the column will be lost.
  - Added the required column `botId` to the `PumpScanner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `PumpScanner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pumpscanner` DROP COLUMN `size`,
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `botId` VARCHAR(191) NOT NULL,
    ADD COLUMN `summary` TEXT NOT NULL,
    MODIFY `reason` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `PumpScanner` ADD CONSTRAINT `PumpScanner_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
