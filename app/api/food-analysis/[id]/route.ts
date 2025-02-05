
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const status = await kv.get(`analysis:${params.id}:status`);
  
  if (status === "pending") {
    return NextResponse.json(
      { status: "pending" },
      { status: 202 }
    );
  }
  
  if (status === "error") {
    const error = await kv.get(`analysis:${params.id}:error`);
    return NextResponse.json(
      { error },
      { status: 500 }
    );
  }
  
  const results = await kv.get(`analysis:${params.id}:results`);
  return NextResponse.json({ foods: results });
}
