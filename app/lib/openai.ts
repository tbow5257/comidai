import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeFoodImage(base64Image: string): Promise<{
  foods: Array<{name: string, portion: string}>;
}> {
  const visionResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this food image and identify each food item and its approximate portion size. Respond with JSON in this format: { foods: [{ name: string, portion: string }] }"
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
