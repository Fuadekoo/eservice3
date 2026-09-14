-- ─────────────────────────────────────────────────────────────────────────────
-- Session expiry, a durable decision trail on requests, duplicate merging, and
-- the same two-step review for requests submitted on behalf of a family member.
--
-- Every column is added nullable or with a default, and every backfill is
-- written so re-running it changes nothing, so this is safe to apply to a
-- live database with existing rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Sessions now expire ──────────────────────────────────────────────────────
ALTER TABLE `session` ADD COLUMN `expiresAt` DATETIME(3) NULL;
CREATE INDEX `session_expiresAt_idx` ON `session`(`expiresAt`);

-- Rows that predate the column have no known expiry. `requireAuth` treats a
-- null as expired, so give the existing ones a full window from now rather
-- than signing everybody out the moment this deploys.
UPDATE `session`
   SET `expiresAt` = DATE_ADD(NOW(3), INTERVAL 12 HOUR)
 WHERE `expiresAt` IS NULL;

-- ── Requests keep the reason they were decided ───────────────────────────────
ALTER TABLE `request` MODIFY COLUMN `approveNote` TEXT NULL;
ALTER TABLE `request` ADD COLUMN `rejectionReason` TEXT NULL;
ALTER TABLE `request` ADD COLUMN `decidedAt` DATETIME(3) NULL;

-- A request already decided has no recorded decision time. The last update is
-- the closest honest approximation, and leaving it null would read as
-- "never decided".
UPDATE `request`
   SET `decidedAt` = `updatedAt`
 WHERE `decidedAt` IS NULL
   AND (`statusbystaff` <> 'pending' OR `statusbyadmin` <> 'pending');

-- ── Duplicate requests can be merged ─────────────────────────────────────────
ALTER TABLE `request` ADD COLUMN `mergedIntoId` VARCHAR(191) NULL;
ALTER TABLE `request` ADD COLUMN `mergedAt` DATETIME(3) NULL;
ALTER TABLE `request` ADD COLUMN `mergedById` VARCHAR(191) NULL;
ALTER TABLE `request` ADD COLUMN `mergeNote` TEXT NULL;

CREATE INDEX `request_mergedIntoId_idx` ON `request`(`mergedIntoId`);
CREATE INDEX `request_mergedById_idx` ON `request`(`mergedById`);

ALTER TABLE `request`
  ADD CONSTRAINT `request_mergedIntoId_fkey`
  FOREIGN KEY (`mergedIntoId`) REFERENCES `request`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `request`
  ADD CONSTRAINT `request_mergedById_fkey`
  FOREIGN KEY (`mergedById`) REFERENCES `staff`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Family requests get the same review as ordinary ones ─────────────────────
ALTER TABLE `request_for_other` ADD COLUMN `requestNumber` VARCHAR(191) NULL;
ALTER TABLE `request_for_other`
  ADD COLUMN `statusbystaff` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending';
ALTER TABLE `request_for_other`
  ADD COLUMN `statusbyadmin` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending';
ALTER TABLE `request_for_other` ADD COLUMN `approveStaffId` VARCHAR(191) NULL;
ALTER TABLE `request_for_other` ADD COLUMN `approveManagerId` VARCHAR(191) NULL;
ALTER TABLE `request_for_other` ADD COLUMN `approveNote` TEXT NULL;
ALTER TABLE `request_for_other` ADD COLUMN `rejectionReason` TEXT NULL;
ALTER TABLE `request_for_other` ADD COLUMN `decidedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `request_for_other_requestNumber_key`
  ON `request_for_other`(`requestNumber`);
CREATE INDEX `request_for_other_approveStaffId_idx`
  ON `request_for_other`(`approveStaffId`);
CREATE INDEX `request_for_other_approveManagerId_idx`
  ON `request_for_other`(`approveManagerId`);

ALTER TABLE `request_for_other`
  ADD CONSTRAINT `request_for_other_approveStaffId_fkey`
  FOREIGN KEY (`approveStaffId`) REFERENCES `staff`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `request_for_other`
  ADD CONSTRAINT `request_for_other_approveManagerId_fkey`
  FOREIGN KEY (`approveManagerId`) REFERENCES `staff`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- The old single `status` becomes the summary of the two new columns. An
-- already-approved row was approved outright, so both steps are satisfied, and
-- a rejected one is rejected at both. Pending rows keep the defaults.
UPDATE `request_for_other`
   SET `statusbystaff` = `status`,
       `statusbyadmin` = `status`
 WHERE `status` <> 'pending';

UPDATE `request_for_other`
   SET `decidedAt` = `updatedAt`
 WHERE `decidedAt` IS NULL
   AND `status` <> 'pending';

-- ── Family requests can have appointments too ────────────────────────────────
-- `requestId` was NOT NULL, so a slot for a dependent could not be written at
-- all: the column it belongs in (`requestForOtherId`) existed, but the row
-- still demanded an ordinary request to point at. Exactly one of the two is
-- set from here on.
ALTER TABLE `appointment` MODIFY COLUMN `requestId` VARCHAR(191) NULL;
