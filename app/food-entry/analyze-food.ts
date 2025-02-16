'use server'

import OpenAI from "openai";

import { logWithTime } from "@/lib/utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FoodProfile {
  name: string;
  estimated_portion: {
    count: number;
    unit: 'g' | 'oz';
  };
  size_description: string;
  typical_serving: string;
  calories: number;
  protein: number;
}

export interface Meal {
  foods: FoodProfile[];
  meal_summary: string;
}


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
                  For each item, provide:
                  - Estimated portion size in photo (in grams or ounces), and the calories and protein per portion
                  
                  - Size description using common household items (e.g., palm sized, golf ball), with estimatei
                  - Of that size description, the metrics of calories and protein associated with that size description (in grams)
                  
                  For the whole meal:
                  - A concise 150-char max summary that creatively describes the meal, capturing key details
                  Respond with JSON in the following format:
                  {
                    foods: [
                      {
                        name: string,
                        estimated_portion: {
                          count: number,
                          unit: 'g' | 'oz'
                        },
                        size_description: string,
                        typical_serving: string,
                        calories: number,
                        protein: number
                      }
                    ],
                    meal_summary: string
                  }
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
  logWithTime("Food image analysis complete");
  return JSON.parse(content);
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
    const { meal_summary, foods } = await generateMealInfo(base64Image);
    logWithTime("OpenAI analysis complete, foods:", foods);

    return { 
      meal_summary,
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
