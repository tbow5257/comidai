import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type FoodProfile = {
  name: string;
  estimated_portion: string;
  size_description: string;
  typical_serving: string;
  calories: number;
}

export async function analyzeFoodImage(base64Image: string): Promise<{
  foods: Array<FoodProfile>;
}> {
  const visionResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
                // Start of Selection
                text: `
                  Analyze this food image and identify each food item.
                  For each item, provide the estimated portion size, describe the size using common household items (e.g., palm sized, golf ball), and include typical serving size metrics with calories.
                  Respond with JSON in the following format:
                  {
                    foods: [
                      {
                        name: string,
                        estimated_portion: string,
                        size_description: string,
                        typical_serving: string,
                        calories: number
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

  const content = visionResponse.choices[0].message.content;
  if (!content) {
    throw new Error("No response from vision model");
  }

  return JSON.parse(content);
}
