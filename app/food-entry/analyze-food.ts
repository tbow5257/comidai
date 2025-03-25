'use server'

import OpenAI from "openai";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { logWithTime } from "@/lib/utils";
import { Meal, MealSchema, FoodCategoryEnum, FoodUnitEnum, FOOD_ANALYSIS_PROMPT } from "app/types/analysis-types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateMealInfo(base64Image: string): Promise<Meal> {
  logWithTime("Starting food image analysis");
  const visionResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
                  Analyze this food image and identify each food item.
                  ${FOOD_ANALYSIS_PROMPT}
                `,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  logWithTime("Received response from vision model");
  const content = visionResponse.choices[0].message.content;
  if (!content) {
    logWithTime("No response from vision model");
    throw new Error("No response from vision model");
  }

  try {
    const parsedContent = JSON.parse(content);
    const validatedMeal = MealSchema.parse(parsedContent);
    logWithTime("Food image analysis complete");
    return validatedMeal;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      logWithTime("Validation error in OpenAI response", {
        error: validationError.message
      });
      throw new Error(`Invalid response format: ${validationError.message}`);
    }
    if (error instanceof SyntaxError) {
      logWithTime("JSON parsing error in OpenAI response");
      throw new Error("Invalid JSON in OpenAI response");
    }
    throw error;
  }
}


export async function analyzeFoodImage(formData: FormData) {
  try {
    const image = formData.get("image") as Blob;
    if (!image) throw new Error("No image provided");
    
    logWithTime("Image blob received:", {
      size: image.size,
      type: image.type
    });

    const base64Image = Buffer.from(await image.arrayBuffer()).toString("base64");
    logWithTime("Base64 image created", { length: base64Image.length });

    logWithTime("Starting OpenAI analysis");
    const { meal_summary, foods, meal_categories } = await generateMealInfo(base64Image);
    logWithTime("OpenAI analysis complete, foods:", foods);

    return { 
      meal_summary,
      meal_categories,
      foods,
      image: `data:image/jpeg;base64,${base64Image}`
    };
  } catch (error: any) {
    logWithTime('Error in analyze-food action', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
