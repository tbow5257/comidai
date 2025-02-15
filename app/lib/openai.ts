import OpenAI from "openai";
import { logWithTime } from "@/lib/utils";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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

export async function analyzeFoodImage(base64Image: string): Promise<{
  foods: Array<FoodProfile>;
}> {
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
                  For each item, provide the estimated portion size (in grams or ounces), describe the size using common household items (e.g., palm sized, golf ball) 
                  with separate count and unit, and include typical serving size metrics with calories and protein (in grams).
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
                    ]
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
