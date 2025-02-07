import { NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/openai";
// import { getNutritionInfo } from "@/lib/nutritionix";
import Client from "@replit/database";
import { Client as ObjectStorageClient } from '@replit/object-storage';
import { xlogWithTime } from "@/lib/utils";

const kvClient = new Client();
const storageClient = new ObjectStorageClient();

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("Content-Type");
    xlogWithTime("Incoming Content-Type:", contentType);

    if (!contentType?.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: 'Unsupported "Content-Type".' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image") as Blob;
    xlogWithTime("Image blob received:", {
      size: image.size,
      type: image.type
    });

    const base64Image = Buffer.from(await image.arrayBuffer()).toString("base64");
    xlogWithTime("Base64 image created", { length: base64Image.length });

    xlogWithTime("Starting OpenAI analysis");
    const { foods } = await analyzeFoodImage(base64Image);
    xlogWithTime("OpenAI analysis complete, foods:", foods);

    return NextResponse.json({ 
      foods,
      image: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (error: any) {
    xlogWithTime('Error in analyze-food handler', {
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
