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

// POST — warn a user
export async function POST(request: NextRequest) {
  const admin = await getModAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { userId, reason } = await request.json();
  if (!userId || !reason) return NextResponse.json({ error: "userId ve reason gerekli" }, { status: 400 });

  await prisma.userWarning.create({
    data: { userId, warnedBy: admin.id, reason },
  });

  // Count warnings
  const warningCount = await prisma.userWarning.count({ where: { userId } });

  // Notify user
  await prisma.notification.create({
    data: {
      userId,
      type: "mod_warning",
      content: `"${reason}" sebebiyle uyarı aldınız. Uyarı sayınız: ${warningCount}/3`,
    },
  });

  // Auto-ban at 3 warnings
  if (warningCount >= 3) {
    const expiresAt = new Date(Date.now() + 86400 * 1000); // 1 day
    await prisma.userBan.create({
      data: { userId, bannedBy: admin.id, reason: "3 uyarı limiti aşıldı", duration: "1d", expiresAt },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, banReason: "3 uyarı limiti aşıldı", banExpiresAt: expiresAt },
    });
    await prisma.notification.create({
      data: {
        userId,
        type: "system",
        content: "3 uyarı limitini aştığınız için hesabınız 1 gün süreyle yasaklanmıştır.",
      },
    });
  }

  return NextResponse.json({ ok: true, warningCount });
}
