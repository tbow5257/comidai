'use server'

import { z } from "zod";

import { db } from "@/lib/db";
import { meals, foodLogs, mealCategories, insertFoodLogSchema, insertMealCategorySchema, InsertFoodLog, InsertMealCategory } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { FoodCategory, FoodCategoryEnum } from "app/types/analysis-types";
import { getAuthUser } from "@/lib/auth";

const createMealPayloadSchema = z.object({
    userId: z.number().optional(),
    name: z.string().min(1),
    timeZone: z.string()
      .refine((tz) => {
        try {
          // Use Intl API to validate timezone
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch (e) {
          return false;
        }
      }, "Invalid timezone"),
    clientTimestamp: z.string().datetime(), // Validates ISO 8601
    mealSummary: z.string().optional(),
    foodLogs: z.array(
      insertFoodLogSchema.omit({ 
        mealId: true,
        createdAt: true 
      })
    ).optional(),
    mealCategories: z.array(FoodCategoryEnum).optional(),
});
  
export async function createMeal(input: FormData | unknown) {
  try {
    const parsed = createMealPayloadSchema.safeParse(
      input instanceof FormData ? Object.fromEntries(input) : input
    );
    
    if (!parsed.success) {
      throw new Error(parsed.error.errors[0].message);
    }

    const user = await getAuthUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { name, foodLogs: foodLogsData = [], mealCategories: mealCategoriesData = [], mealSummary, timeZone, clientTimestamp } = parsed.data;

    const result = await db.transaction(async (tx) => {
      const [meal] = await tx
        .insert(meals)
        .values({
          userId: user.id,
          name,
          mealSummary,
          timeZone,
          createdAt: new Date(clientTimestamp)
        })
        .returning();

      let insertedFoodLogs: Array<InsertFoodLog> = [];
      if (foodLogsData.length > 0) {
        insertedFoodLogs = await tx
          .insert(foodLogs)
          .values(foodLogsData.map(log => ({
            ...log,
            mealId: meal.id
          })))
          .returning();
      }

      let insertedMealCategories: Array<InsertMealCategory> = [];
      if (mealCategoriesData.length > 0) {
        insertedMealCategories = await tx
          .insert(mealCategories)
          .values(mealCategoriesData.map(category => ({
            mealId: meal.id,
            category: category as FoodCategory
          })))
          .returning();
      }

      return { meal, foodLogs: insertedFoodLogs, mealCategories: insertedMealCategories };
    });

    revalidatePath('/');
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create meal' };
  }
}
