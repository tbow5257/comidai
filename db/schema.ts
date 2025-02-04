import { pgTable, text, serial, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  dailyCalorieGoal: integer("daily_calorie_goal").default(2000),
});

export const foodLogs = pgTable("food_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  protein: decimal("protein").notNull(),
  carbs: decimal("carbs").notNull(),
  fat: decimal("fat").notNull(),
  portionSize: text("portion_size").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const foodLogRelations = relations(foodLogs, ({ one }) => ({
  user: one(users, {
    fields: [foodLogs.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertFoodLogSchema = createInsertSchema(foodLogs);
export const selectFoodLogSchema = createSelectSchema(foodLogs);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertFoodLog = typeof foodLogs.$inferInsert;
export type SelectFoodLog = typeof foodLogs.$inferSelect;
