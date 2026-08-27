-- A role is a job description, not a place.
--
-- `role.officeId` meant every office kept its own copy of the same role, so one
-- job ("manager") existed two dozen times over. Which office a person works in
-- is already recorded once, on their staff row, and that is now the only place
-- it lives.
--
-- Run `npm run merge:duplicate-roles` BEFORE applying this. It collapses the
-- per-office copies onto one role per name, moving users and permissions across
-- first, so nothing is lost here. Dropping the column without merging would
-- leave the duplicates behind as indistinguishable rows and the unique index
-- below would fail.

-- The foreign key has to go before the column it is built on.
ALTER TABLE `role` DROP FOREIGN KEY `role_officeId_fkey`;

DROP INDEX `role_officeId_fkey` ON `role`;

ALTER TABLE `role` DROP COLUMN `officeId`;

-- With roles global, two rows sharing a name would be indistinguishable in
-- every dropdown, so the name carries the uniqueness the office used to.
CREATE UNIQUE INDEX `role_name_key` ON `role`(`name`);
