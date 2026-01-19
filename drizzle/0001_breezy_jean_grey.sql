CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`personaId` int,
	`type` enum('title','note','hashtag','cover') NOT NULL,
	`scenario` enum('delay','dropout','misconduct','fail','leave','withdraw'),
	`emotion` enum('empathy','warning','help','success','critic'),
	`input` text,
	`output` json,
	`isFavorite` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hotContents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`author` varchar(100),
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`scenario` enum('delay','dropout','misconduct','fail','leave','withdraw'),
	`titlePattern` varchar(100),
	`coverType` enum('big_text','screenshot','comparison','person','chat'),
	`emotionWords` json,
	`hashtags` json,
	`analysis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hotContents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('senior_sister','professional','anxious','critic') NOT NULL,
	`description` text,
	`greetings` json,
	`toneWords` json,
	`emojiStyle` json,
	`samplePhrases` json,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personas_id` PRIMARY KEY(`id`)
);
