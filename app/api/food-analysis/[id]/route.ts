import { NextResponse } from "next/server";
import Client from "@replit/database";
import { Client as ObjectStorageClient } from '@replit/object-storage';

const client = new Client();
const storageClient = new ObjectStorageClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const statusResult = await client.get(`analysis:${id}:status`);
    if (!statusResult.ok) {
      return NextResponse.json(
        { error: statusResult.error?.message || "Failed to fetch status" },
        { status: 500 }
      );
    }

    const status = statusResult.value;

    if (status === "pending") {
      return NextResponse.json(
        { status: "pending" },
        { status: 202 }
      );
    }

    if (status === "error") {
      const errorResult = await client.get(`analysis:${id}:error`);
      if (!errorResult.ok) {
        return NextResponse.json(
          { error: "Failed to fetch error details" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: errorResult.value },
        { status: 500 }
      );
    }

    const resultsResult = await client.get(`analysis:${id}:results`);
    if (!resultsResult.ok) {
      return NextResponse.json(
        { error: "Failed to fetch results" },
        { status: 500 }
      );
    }

    // grab image, process it to display
    console.log('imageData ', `analysis:${id}:image`)
    const imageData = await client.get(`analysis:${id}:image`);
    
    let base64Image = null;
    if (imageData?.value.name) {
      const downloadResult = await storageClient.downloadAsText(imageData.value.name);
      if (downloadResult.ok) {
        base64Image = downloadResult.value; // This is already base64
      }
    }

    return NextResponse.json({ 
      foods: JSON.parse(resultsResult.value), 
      image: base64Image ? `data:image/jpeg;base64,${base64Image}` : null
     });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}