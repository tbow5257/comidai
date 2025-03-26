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

const foodCategories = FoodCategoryEnum.options.map(cat => `"${cat}"`).join(" | ");
const foodUnits = FoodUnitEnum.options.map(unit => `"${unit}"`).join(" | ");

export const FOOD_ANALYSIS_PROMPT = `
                  For each item, provide:
                  - Estimated portion size, this size MUST BE IN GRAMS OR OUNCES, and the calories and protein per for that portion amount
                  
                  - Size description using common household items (e.g., palm sized, golf ball), with estimate
                  - For that size description, the metrics of calories and protein associated with that size description (in grams)
                  
                  For the whole meal:
                  - meal_summary: A concise 150-char max summary that creatively describes the meal, capturing key details
                  - meal_categories: Categorize each food item into basic food types: ${FoodCategoryEnum.options.join(", ")}
                  
                  Important: For eggs, convert to grams (1 large egg ≈ 50g) or ounces (1 large egg ≈ 1.75oz).
                  
                  Respond with JSON in the following format:
                  {
                    foods: [
                      {
                        name: string,
                        estimated_portion: {
                          count: number,
                          unit: ${foodUnits}
                        },
                        size_description: string,
                        typical_serving: string,
                        calories: number,
                        protein: number
                      }
                    ],
                    meal_summary: string,
                    meal_categories: [${foodCategories}]
                  }
                `;
