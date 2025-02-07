import { NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/openai";
// import { getNutritionInfo } from "@/lib/nutritionix";
import Client from "@replit/database";
import { nanoid } from "nanoid";
import { Client as ObjectStorageClient } from '@replit/object-storage';
import { logWithTime } from "@/lib/utils";

const kvClient = new Client();
const storageClient = new ObjectStorageClient();

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("Content-Type");
    logWithTime("Incoming Content-Type:", contentType);

    if (
      !contentType ||
      (!contentType.startsWith("multipart/form-data") &&
        !contentType.startsWith("application/x-www-form-urlencoded"))
    ) {
      return NextResponse.json(
        { error: 'Unsupported "Content-Type".' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image") as Blob;
    logWithTime("Image blob received:", {
      size: image.size,
      type: image.type
    });

    const base64Image = Buffer.from(await image.arrayBuffer()).toString("base64");
    logWithTime("Base64 image created:", {
      length: base64Image.length,
      preview: base64Image.substring(0, 50) + "..." // First 50 chars
    });
    
    
    const analysisId = nanoid();
    const imageName = `${analysisId}.jpg`; // Define image name
    logWithTime(`Starting analysis for ID: ${analysisId}`);

    logWithTime(`Attempting to upload image ${imageName}`, {
      imageNameLength: imageName.length,
      base64Length: base64Image.length
    });    
    // TODO uploadFromText might need base64 info
    const uploadResult = await storageClient.uploadFromText(imageName, base64Image);
    logWithTime("Storage upload result:", {
      ok: uploadResult.ok,
      error: uploadResult.error || null
    });
    if (!uploadResult.ok) {
      throw new Error(uploadResult?.error?.message || 'Image upload failed');
    }
    
    // Store pending status with image reference
    await kvClient.set(`analysis:${analysisId}:status`, "pending");
    await kvClient.set(`analysis:${analysisId}:image`, {
      name: imageName,
      createdAt: new Date().toISOString()
    }); // set name and created at for CRON to know when to delete later
    logWithTime("Stored image reference in KV:", {
      key: `analysis:${analysisId}:image`,
      imageName,
      createdAt: new Date().toISOString()
    });
    
    
    // Process in background with detailed logging
    (async () => {
      logWithTime(`Background process started for ${analysisId}`);
      
      try {
        // Log each step of the process
        logWithTime(`Starting OpenAI analysis for ${analysisId}`);
        const { foods } = await analyzeFoodImage(base64Image);
        logWithTime(`OpenAI analysis complete for ${analysisId}, foods:`, foods);
      
        // TODO: defer usage of nutritionx, decide later whether necessary (openai can do alot)
        // const foodData = [];
        // Start of Selection
        // for (const [index, food] of analysis.foods.entries()) {
          // logWithTime(`Processing food ${index + 1}/${analysis.foods.length} for ${analysisId}`);
          // const query = `${food.portion} ${food.name}`;
          // logWithTime(`Querying Nutritionix for: ${query}`);
          // const nutrition = await getNutritionInfo(query);
          // foodData.push({ ...food });
        // }

        // logWithTime(`All foods processed for ${analysisId}`, foodData);
        
        // Store results
        await kvClient.set(`analysis:${analysisId}:results`, JSON.stringify(foods));
        await kvClient.set(`analysis:${analysisId}:status`, "complete");
        logWithTime(`Analysis completed for ${analysisId}`);        
        
        // Log final state verification
        const finalStatus = await kvClient.get(`analysis:${analysisId}:status`);
        const finalResults = await kvClient.get(`analysis:${analysisId}:results`);
        logWithTime(`Final state verification for ${analysisId}`, {
          status: finalStatus,
          hasResults: !!finalResults
        });

      } catch (error: unknown) {
        const typedError = error as Error;
        logWithTime(`Error in background process for ${analysisId}`, {
          error: typedError.message,
          stack: typedError.stack
        });
        await kvClient.set(`analysis:${analysisId}:status`, "error");
        await kvClient.set(`analysis:${analysisId}:error`, typedError.message);
      }
    })().catch(error => {
      // Catch any errors in the outer promise
      logWithTime(`Critical error in background process for ${analysisId}`, {
        error: error.message,
        stack: error.stack
      });
    });
    
    logWithTime(`Returning analysisId: ${analysisId}`);
    return NextResponse.json({ analysisId });
    
  } catch (error: any) {
    logWithTime('Error in main request handler', {
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}