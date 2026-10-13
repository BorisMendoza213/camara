ALTER TABLE `photos` ADD `note` text;--> statement-breakpoint
ALTER TABLE `photos` ADD `favorite` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `photos` ADD `album_id` text REFERENCES albums(id);