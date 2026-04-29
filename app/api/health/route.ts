import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  });
}
