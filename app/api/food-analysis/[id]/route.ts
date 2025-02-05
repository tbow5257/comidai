import { NextResponse } from "next/server";
import Client from "@replit/database";

const client = new Client();

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

    return NextResponse.json({ foods: JSON.parse(resultsResult.value) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}