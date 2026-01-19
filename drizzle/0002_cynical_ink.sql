CREATE TABLE `feishuConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appId` varchar(100) NOT NULL,
	`appSecret` varchar(200) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feishuConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `feishuConfigs_userId_unique` UNIQUE(`userId`)
);
