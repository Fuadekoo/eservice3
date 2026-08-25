-- Per-day counter backing request number allocation. Incrementing a single row
-- is atomic, so concurrent applications are handed distinct numbers instead of
-- colliding on the unique index and retrying.
CREATE TABLE `request_sequence` (
    `id` VARCHAR(191) NOT NULL,
    `seq` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed each day's counter from the numbers already issued, so the sequence
-- continues rather than restarting and colliding with existing rows.
INSERT INTO `request_sequence` (`id`, `seq`)
SELECT
    SUBSTRING(`requestNumber`, 5, 8) AS `day`,
    MAX(CAST(SUBSTRING(`requestNumber`, 14) AS UNSIGNED)) AS `seq`
FROM `request`
WHERE `requestNumber` REGEXP '^REQ-[0-9]{8}-[0-9]{5}$'
GROUP BY SUBSTRING(`requestNumber`, 5, 8);
