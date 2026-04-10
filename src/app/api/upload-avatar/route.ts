import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string || "avatar"; // "avatar" or "cover"

  if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5MB" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: "Geçersiz format" }, { status: 400 });

  // Use service role client to bypass RLS
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const bucket = type === "cover" ? "cover-images" : "avatars";
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = adminClient.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
