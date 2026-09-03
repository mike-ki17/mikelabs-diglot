ALTER TABLE `posts` ADD `excerpt` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `translation_group_id` integer;--> statement-breakpoint
CREATE INDEX `posts_translation_group_id_idx` ON `posts` (`translation_group_id`);