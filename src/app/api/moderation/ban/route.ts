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

function parseDuration(d: string): Date | null {
  const now = new Date();
  if (d === "permanent") return null;
  const map: Record<string, number> = { "1h": 3600, "1d": 86400, "7d": 604800, "14d": 1209600, "30d": 2592000 };
  const secs = map[d];
  if (!secs) return null;
  return new Date(now.getTime() + secs * 1000);
}

// POST — ban a user
export async function POST(request: NextRequest) {
  const admin = await getModAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { userId, reason, duration } = await request.json();
  if (!userId || !reason) return NextResponse.json({ error: "userId ve reason gerekli" }, { status: 400 });

  const expiresAt = parseDuration(duration || "1d");

  await prisma.userBan.create({
    data: { userId, bannedBy: admin.id, reason, duration: duration || "1d", expiresAt },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, banReason: reason, banExpiresAt: expiresAt },
  });

  // Send notification to banned user
  const durationLabels: Record<string, string> = { "1h": "1 saat", "1d": "1 gün", "7d": "7 gün", "14d": "14 gün", "30d": "30 gün", permanent: "kalıcı" };
  await prisma.notification.create({
    data: {
      userId,
      type: "system",
      content: `Hesabınız "${reason}" nedeniyle ${durationLabels[duration] || duration} süreyle yasaklanmıştır.`,
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — unban
export async function DELETE(request: NextRequest) {
  const admin = await getModAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId gerekli" }, { status: 400 });

  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, banReason: null, banExpiresAt: null },
  });

  return NextResponse.json({ ok: true });
}
