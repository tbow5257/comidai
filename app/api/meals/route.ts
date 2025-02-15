import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meals, foodLogs, insertFoodLogSchema, insertMealSchema } from "@/lib/db/schema";
import { z } from "zod";

export type FoodLogPayload = z.infer<typeof insertFoodLogSchema>;

export const createMealPayloadSchema = z.object({
  userId: z.number(),
  name: z.string().min(1),
  foodLogs: z.array(
    insertFoodLogSchema.omit({ 
      mealId: true,
      createdAt: true 
    })
  ).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createMealPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors },
        { status: 400 }
      );
    }

    const { userId, name, foodLogs: foodLogsData = [] } = parsed.data;

    const result = await db.transaction(async (tx) => {
      // 1. Create the meal
      const [meal] = await tx
        .insert(meals)
        .values({
          userId,
          name
        })
        .returning();

      // 2. Create food logs only if they exist
      let insertedFoodLogs: Array<FoodLogPayload> = [];
      if (foodLogsData.length > 0) {
        const foodLogsWithMealId = foodLogsData.map(log => ({
          ...log,
          mealId: meal.id
        }));

        insertedFoodLogs = await tx
          .insert(foodLogs)
          .values(foodLogsWithMealId)
          .returning();
      }

      return {
        meal,
        foodLogs: insertedFoodLogs
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating meal:', error);
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    );
  }
}