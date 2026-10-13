CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`uri` text NOT NULL,
	`source` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`accuracy` real,
	`timestamp` integer,
	`created_at` integer NOT NULL
);
