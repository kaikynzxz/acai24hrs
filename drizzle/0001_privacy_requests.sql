CREATE TABLE `privacy_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `request_type` text NOT NULL,
  `requester_name` text NOT NULL,
  `contact` text NOT NULL,
  `details` text NOT NULL,
  `status` text DEFAULT 'received' NOT NULL,
  `created_at` integer NOT NULL,
  `retention_until` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_privacy_requests_status_created_at` ON `privacy_requests` (`status`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
