'use server'

import { analyzeFoodImage as openAIAnalyze } from "app/food-entry/openai";
import { logWithTime } from "@/lib/utils";

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
    const { meal_summary, foods } = await openAIAnalyze(base64Image);
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
