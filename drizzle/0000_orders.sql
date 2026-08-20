CREATE TABLE `orders` (
  `id` text PRIMARY KEY NOT NULL,
  `stripe_session_id` text,
  `customer_name` text NOT NULL,
  `customer_phone` text NOT NULL,
  `delivery_address` text NOT NULL,
  `items_json` text NOT NULL,
  `total_cents` integer NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_stripe_session_id` ON `orders` (`stripe_session_id`) WHERE `stripe_session_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `idx_orders_status_created_at` ON `orders` (`status`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
