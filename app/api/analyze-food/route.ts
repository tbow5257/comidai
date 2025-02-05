import { NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/openai";
import { getNutritionInfo } from "@/lib/nutritionix";
import Client from "@replit/database";
import { nanoid } from "nanoid";

const client = new Client();

// Helper to log with timestamps
const logWithTime = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
};

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
    const base64Image = Buffer.from(await image.arrayBuffer()).toString("base64");
    
    const analysisId = nanoid();
    logWithTime(`Starting analysis for ID: ${analysisId}`);
    
    // Store pending status
    await client.set(`analysis:${analysisId}:status`, "pending");
    
    // Process in background with detailed logging
    (async () => {
      logWithTime(`Background process started for ${analysisId}`);
      
      try {
        // Log each step of the process
        logWithTime(`Starting OpenAI analysis for ${analysisId}`);
        const analysis = await analyzeFoodImage(base64Image);
        logWithTime(`OpenAI analysis complete for ${analysisId}`, analysis);
      
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
        await client.set(`analysis:${analysisId}:results`, JSON.stringify(analysis));
        await client.set(`analysis:${analysisId}:status`, "complete");
        logWithTime(`Analysis completed for ${analysisId}`);
        
        // Log final state verification
        const finalStatus = await client.get(`analysis:${analysisId}:status`);
        const finalResults = await client.get(`analysis:${analysisId}:results`);
        logWithTime(`Final state verification for ${analysisId}`, {
          status: finalStatus,
          hasResults: !!finalResults
        });

      } catch (error) {
        logWithTime(`Error in background process for ${analysisId}`, {
          error: error.message,
          stack: error.stack
        });
        await client.set(`analysis:${analysisId}:status`, "error");
        await client.set(`analysis:${analysisId}:error`, error.message);
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
    
  } catch (error) {
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