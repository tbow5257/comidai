'use server'

import OpenAI from "openai";
import { logWithTime } from "@/lib/utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeVoiceNote(formData: FormData) {
  try {
    const audio = formData.get("audio") as Blob;
    if (!audio) throw new Error("No audio provided");

    logWithTime("Audio blob received", {
      size: audio.size,
      type: audio.type
    });

    // Convert Blob to File
    const audioFile = new File([audio], "audio.webm", { 
      type: audio.type,
      lastModified: Date.now(),
    });

    // Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en"
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
            
            Follow the same format as image analysis:
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
              ],
              meal_summary: string
            }
          `
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = analysis.choices[0].message.content;
    if (!content) throw new Error("No response from analysis");

    return JSON.parse(content);
  } catch (error: any) {
    logWithTime('Error in analyze-voice action', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}