'use server'

import OpenAI, { toFile } from "openai";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

import { logWithTime } from "@/lib/utils";
import { FOOD_ANALYSIS_PROMPT, MealSchema } from "app/types/analysis-types";


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Map MIME types to file extensions that Whisper supports
function getMimeTypeExtension(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('mpeg')) return 'mpga';
  if (mimeType.includes('x-m4a')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav') || mimeType.includes('wave')) return 'wav';
  if (mimeType.includes('flac')) return 'flac';
  
  // Default to webm if unknown
  return 'webm';
}

export async function analyzeVoiceNote(formData: FormData) {
  try {
    const audio = formData.get("audio") as Blob;
    if (!audio) throw new Error("No audio provided");

    logWithTime("Audio blob received", {
      size: audio.size,
      type: audio.type
    });

    // Determine file extension directly from MIME type
    const fileExtension = getMimeTypeExtension(audio.type);
    const contentType = audio.type || `audio/${fileExtension}`;

    // Convert the blob to a buffer for the OpenAI API
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logWithTime("Using the toFile utility for Whisper API compatibility", {
      bufferSize: buffer.length,
      contentType: contentType
    });

    // Create a file using the OpenAI toFile utility
    const audioFile = await toFile(
      buffer, 
      `audio.${fileExtension}`, 
      { type: contentType }
    );

    // Transcribe audio using the toFile utility from OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-transcribe",
      language: "en"
    });

    logWithTime("Transcription received", {
      text: transcription.text
    });

    // Use the transcription to analyze food content
    const analysis = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: `
            Analyze this food description and identify each food item mentioned:
            "${transcription.text}"
            
            ${FOOD_ANALYSIS_PROMPT}
          `
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = analysis.choices[0].message.content;

    if (!content) {
      logWithTime("No response from text analysis model");
      throw new Error("No response from text analysis model");
    }  

    try {
      const parsedContent = JSON.parse(content);
      const validatedMeal = MealSchema.parse(parsedContent);
      logWithTime("Food image analysis complete");
      return validatedMeal;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        logWithTime("Validation error in OpenAI response", {
          error: validationError.message,
          content: content,
          details: error.errors
        });
        throw new Error(`Invalid response format: ${validationError.message}`);
      }
      if (error instanceof SyntaxError) {
        logWithTime("JSON parsing error in OpenAI response", {
          content: content,
          error: error.message
        });
        throw new Error("Invalid JSON in OpenAI response");
      }
      throw error;
    }

  } catch (error: any) {
    logWithTime('Error in analyze-voice action', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name,
      ...(error.response && { response: error.response })
    });
    throw error;
  }
}