-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `officeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `request` ADD COLUMN `officeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `request_for_other` ADD COLUMN `officeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `service` ADD COLUMN `roomNumber` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `request` ADD CONSTRAINT `request_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_for_other` ADD CONSTRAINT `request_for_other_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
