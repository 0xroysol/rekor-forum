import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getModAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "MOD")) return null;
  return dbUser;
}

// POST — mute a user in chat
export async function POST(request: NextRequest) {
  const admin = await getModAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { userId, roomId, reason, duration } = await request.json();
  if (!userId || !roomId) return NextResponse.json({ error: "userId ve roomId gerekli" }, { status: 400 });

  const durationMap: Record<string, number> = { "5m": 300, "15m": 900, "1h": 3600, "1d": 86400 };
  const secs = durationMap[duration || "5m"] || 300;
  const expiresAt = new Date(Date.now() + secs * 1000);

  await prisma.chatMute.create({
    data: { userId, mutedBy: admin.id, roomId, reason: reason || null, expiresAt },
  });

  return NextResponse.json({ ok: true, expiresAt });
}
