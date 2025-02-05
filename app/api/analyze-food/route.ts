
import { NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/openai";
import { getNutritionInfo } from "@/lib/nutritionix";
import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as Blob;
    const base64Image = Buffer.from(await image.arrayBuffer()).toString("base64");
    
    // Start analysis in background
    const analysisId = nanoid();
    
    // Store pending status
    await kv.set(`analysis:${analysisId}:status`, "pending");
    
    // Process in background
    (async () => {
      try {
        const analysis = await analyzeFoodImage(base64Image);
        const foodData = [];
        
        for (const food of analysis.foods) {
          const query = `${food.portion} ${food.name}`;
          const nutrition = await getNutritionInfo(query);
          foodData.push({ ...food, ...nutrition });
        }
        
        // Store results
        await kv.set(`analysis:${analysisId}:results`, foodData);
        await kv.set(`analysis:${analysisId}:status`, "complete");
      } catch (error) {
        await kv.set(`analysis:${analysisId}:status`, "error");
        await kv.set(`analysis:${analysisId}:error`, error.message);
      }
    })();
    
    return NextResponse.json({ analysisId });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
