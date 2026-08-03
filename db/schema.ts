import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const siteStatus = pgEnum("site_status", [
  "pending",
  "approved",
  "rejected",
]);

export const sites = pgTable(
  "sites",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    url: text("url").notNull().unique(),
    title: text("title").notNull(),
    status: siteStatus("status").notNull().default("pending"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sites_status_position_idx").on(table.status, table.position),
  ],
);

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
