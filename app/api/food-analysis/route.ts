import { NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/openai";
// import { getNutritionInfo } from "@/lib/nutritionix";
import { logWithTime } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("Content-Type");
    logWithTime("Incoming Content-Type:", contentType);

    if (!contentType?.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: 'Unsupported "Content-Type".' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image") as Blob;
    logWithTime("Image blob received:", {
      size: image.size,
      type: image.type
    });

    const base64Image = Buffer.from(await image.arrayBuffer()).toString("base64");
    logWithTime("Base64 image created", { length: base64Image.length });

    logWithTime("Starting OpenAI analysis");
    const { meal_summary, foods } = await analyzeFoodImage(base64Image);
    logWithTime("OpenAI analysis complete, foods:", foods);

    return NextResponse.json({ 
      meal_summary,
      foods,
      image: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (error: any) {
    logWithTime('Error in analyze-food handler', {
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
