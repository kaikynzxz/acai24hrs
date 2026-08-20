import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const orders=sqliteTable("orders",{id:text("id").primaryKey(),stripeSessionId:text("stripe_session_id"),customerName:text("customer_name").notNull(),customerPhone:text("customer_phone").notNull(),deliveryAddress:text("delivery_address").notNull(),itemsJson:text("items_json").notNull(),totalCents:integer("total_cents").notNull(),status:text("status").notNull().default("pending"),createdAt:integer("created_at").notNull()});
export const privacyRequests=sqliteTable("privacy_requests",{
 id:text("id").primaryKey(),
 requestType:text("request_type").notNull(),
 requesterName:text("requester_name").notNull(),
 contact:text("contact").notNull(),
 details:text("details").notNull(),
 status:text("status").notNull().default("received"),
 createdAt:integer("created_at").notNull(),
 retentionUntil:integer("retention_until").notNull(),
},table=>[index("idx_privacy_requests_status_created_at").on(table.status,table.createdAt)]);
