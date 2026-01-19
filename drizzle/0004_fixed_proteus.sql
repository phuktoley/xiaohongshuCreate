CREATE TABLE `contents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`note` text NOT NULL,
	`hashtags` json,
	`coverMainText` varchar(200),
	`coverSubText` varchar(200),
	`coverColorScheme` json,
	`coverLayout` varchar(50),
	`coverType` varchar(50),
	`scenario` enum('delay','dropout','misconduct','fail','leave','withdraw'),
	`emotion` enum('empathy','warning','help','success','critic'),
	`personaType` varchar(50),
	`schoolName` varchar(200),
	`isFavorite` boolean DEFAULT false,
	`isExported` boolean DEFAULT false,
	`exportedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200),
	`items` json,
	`scenario` enum('delay','dropout','misconduct','fail','leave','withdraw'),
	`emotion` enum('empathy','warning','help','success','critic'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drafts_id` PRIMARY KEY(`id`)
);
