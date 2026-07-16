-- AlterTable
ALTER TABLE `report` MODIFY `receiverStatus` ENUM('pending', 'sent', 'received', 'read', 'archived', 'approved', 'rejected') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `user` ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL DEFAULT 'OTHER',
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED') NULL DEFAULT 'ACTIVE';
