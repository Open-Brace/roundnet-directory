import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const siteStatus = pgEnum("site_status", [
  "pending",
  "approved",
  "rejected",
]);

export const categories = pgTable(
  "categories",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("categories_slug_idx").on(table.slug),
    index("categories_position_idx").on(table.position),
  ],
);

export const sites = pgTable(
  "sites",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    url: text("url").notNull().unique(),
    title: text("title").notNull(),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "restrict",
    }),
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
    index("sites_status_category_position_idx").on(
      table.status,
      table.categoryId,
      table.position,
    ),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
