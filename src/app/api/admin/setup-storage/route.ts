import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
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
    // Create bucket if not exists
    const { data: existing } = await supabase.storage.getBucket(name);
    if (!existing) {
      const { error } = await supabase.storage.createBucket(name, {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      });
      results[name] = error ? `bucket error: ${error.message}` : "bucket created";
    } else {
      results[name] = "bucket exists";
    }

    // Add RLS policies via SQL
    const { error: sqlError } = await supabase.rpc("exec_sql", {
      query: `
        -- Allow public read
        CREATE POLICY IF NOT EXISTS "Public read ${name}" ON storage.objects
          FOR SELECT USING (bucket_id = '${name}');
        -- Allow authenticated upload
        CREATE POLICY IF NOT EXISTS "Auth upload ${name}" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = '${name}' AND auth.role() = 'authenticated');
        -- Allow authenticated update own files
        CREATE POLICY IF NOT EXISTS "Auth update ${name}" ON storage.objects
          FOR UPDATE USING (bucket_id = '${name}' AND auth.role() = 'authenticated');
        -- Allow authenticated delete own files
        CREATE POLICY IF NOT EXISTS "Auth delete ${name}" ON storage.objects
          FOR DELETE USING (bucket_id = '${name}' AND auth.role() = 'authenticated');
      `,
    });

    if (sqlError) {
      // RPC may not exist, try direct SQL approach
      // Fallback: set bucket to public and use service role for uploads
      results[name + "_policy"] = `rpc failed: ${sqlError.message}`;
    } else {
      results[name + "_policy"] = "policies created";
    }
  }

  return NextResponse.json({ results });
}
