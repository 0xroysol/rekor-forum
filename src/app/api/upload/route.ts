import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Giriş yapmanız gerekiyor" },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Geçersiz format" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `post-images/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json(
      { error: "Yükleme başarısız: " + error.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
