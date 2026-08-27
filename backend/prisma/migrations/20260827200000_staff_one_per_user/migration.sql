-- One staff row per user.
--
-- The application has always assumed this: authentication reads the first staff
-- row and every office lookup takes it, so a second row was silently ignored
-- rather than meaning anything. Declaring it makes the database agree with the
-- code, and stops a duplicate assignment being created in the first place.
--
-- Safe to apply: no user currently holds more than one staff row.
CREATE UNIQUE INDEX `staff_userId_key` ON `staff`(`userId`);
