import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Only allow with cron secret or admin
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const buckets = ["avatars", "post-images", "cover-images"];
  const results: Record<string, string> = {};

  for (const name of buckets) {
    const { data: existing } = await supabase.storage.getBucket(name);
    if (existing) {
      results[name] = "already exists";
      continue;
    }

    const { error } = await supabase.storage.createBucket(name, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    });

    if (error) {
      results[name] = `error: ${error.message}`;
    } else {
      results[name] = "created";
    }
  }

  return NextResponse.json({ results });
}
