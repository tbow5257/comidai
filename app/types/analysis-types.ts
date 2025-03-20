import { z } from "zod";

export const FoodCategoryEnum = z.enum([
  "poultry", "fish", "red_meat", "vegetable", "fruit", 
  "grain", "dairy", "egg", "legume", "nuts_seeds", 
  "oils_fats", "sweets", "beverages", "other"
]);

export const FoodUnitEnum = z.enum(["g", "oz"]);

export const FoodProfileSchema = z.object({
  name: z.string(),
  estimated_portion: z.object({
    count: z.number(),
    unit: FoodUnitEnum
  }),
  size_description: z.string(),
  typical_serving: z.string(),
  calories: z.number(),
  protein: z.number()
});

export const MealSchema = z.object({
  foods: z.array(FoodProfileSchema),
  meal_summary: z.string().max(150),
  meal_categories: z.array(FoodCategoryEnum)
});

// Types are now inferred from the schema
export type FoodCategory = z.infer<typeof FoodCategoryEnum>;
export type FoodProfile = z.infer<typeof FoodProfileSchema>;
export type Meal = z.infer<typeof MealSchema>;

export const CATEGORY_ICONS = {
  poultry: "🍗",
  fish: "🐟",
  red_meat: "🥩",
  vegetable: "🥬",
  fruit: "🍎",
  grain: "🍚",
  dairy: "🥛",
  egg: "🥚",
  legume: "🫘",
  nuts_seeds: "🥜",
  oils_fats: "🫗",
  sweets: "🍪",
  beverages: "🥤",
  other: "🍽️",
} as const satisfies Record<FoodCategory, string>;
