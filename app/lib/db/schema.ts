import { pgTable, text, serial, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  dailyCalorieGoal: integer("daily_calorie_goal").default(2000),
});

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3),
});

export const foodLogs = pgTable("food_logs", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").references(() => meals.id).notNull(),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  protein: decimal("protein", { precision: 6, scale: 1 }).notNull(),
  portionSize: decimal("portion_size", { precision: 6, scale: 1 }).notNull(),
  portionUnit: text("portionUnit").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // TODO: maybe implement more later
  // carbs: decimal("carbs").notNull(),
  // fat: decimal("fat").notNull(),
  // imageUrl: text("image_url"),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  name: text("name").notNull(),
});

export const mealRelations = relations(meals, ({ one, many }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
  foodLogs: many(foodLogs),
}));

export const foodLogRelations = relations(foodLogs, ({ one }) => ({
  meal: one(meals, {
    fields: [foodLogs.mealId],
    references: [meals.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertFoodLogSchema = createInsertSchema(foodLogs, {
  portionUnit: (schema) => schema.refine(
    (val) => ['g', 'oz'].includes(val), 
    { message: "Portion unit must be 'g' or 'oz'" }
  )
});
export const selectFoodLogSchema = createSelectSchema(foodLogs);
export const insertMealSchema = createInsertSchema(meals);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertFoodLog = typeof foodLogs.$inferInsert;
export type InsertMeal = typeof meals.$inferInsert;
export type SelectFoodLog = typeof foodLogs.$inferSelect;
