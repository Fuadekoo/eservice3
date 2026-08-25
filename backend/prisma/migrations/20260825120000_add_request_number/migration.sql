-- Human-readable reference for each service request (REQ-YYYYMMDD-NNNNN).
-- Added nullable first so existing rows can be backfilled before the column
-- becomes NOT NULL and unique.
ALTER TABLE `request` ADD COLUMN `requestNumber` VARCHAR(191) NULL;

-- Backfill: number every existing request by the day it was created, in
-- creation order, so the historical sequence matches what the generator would
-- have produced. `id` breaks ties for rows sharing a timestamp.
UPDATE `request` AS `r`
JOIN (
    SELECT
        `id`,
        CONCAT(
            'REQ-',
            DATE_FORMAT(`createdAt`, '%Y%m%d'),
            '-',
            LPAD(
                ROW_NUMBER() OVER (
                    PARTITION BY DATE(`createdAt`)
                    ORDER BY `createdAt`, `id`
                ),
                5,
                '0'
            )
        ) AS `generated`
    FROM `request`
) AS `numbered` ON `numbered`.`id` = `r`.`id`
SET `r`.`requestNumber` = `numbered`.`generated`
WHERE `r`.`requestNumber` IS NULL;

ALTER TABLE `request` MODIFY COLUMN `requestNumber` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `request_requestNumber_key` ON `request`(`requestNumber`);
