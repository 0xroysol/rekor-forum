import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { email: user.email! } });
}

function isModOrAdmin(user: { role: string }) {
  return user.role === "MOD" || user.role === "ADMIN";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }
    if (!isModOrAdmin(dbUser)) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const { id } = await params;
    const { status, action } = await request.json();

    if (!status || !["PENDING", "REVIEWED", "RESOLVED"].includes(status)) {
      return NextResponse.json({ error: "Geçerli bir durum belirtilmelidir." }, { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "Rapor bulunamadı." }, { status: 404 });
    }

    if (action === "deleteContent") {
      if (report.type === "post") {
        await prisma.post.update({
          where: { id: report.targetId },
          data: { content: "[Bu içerik moderatör tarafından kaldırılmıştır.]" },
        });
      } else if (report.type === "thread") {
        await prisma.thread.update({
          where: { id: report.targetId },
          data: { title: "[Silindi]" },
        });
        await prisma.post.updateMany({
          where: { threadId: report.targetId },
          data: { content: "[Bu konu silindi.]" },
        });
      }
    }

    if (action === "banUser") {
      let authorId: string | null = null;

      if (report.type === "post") {
        const post = await prisma.post.findUnique({
          where: { id: report.targetId },
          select: { authorId: true },
        });
        authorId = post?.authorId || null;
      } else if (report.type === "thread") {
        const thread = await prisma.thread.findUnique({
          where: { id: report.targetId },
          select: { authorId: true },
        });
        authorId = thread?.authorId || null;
      }

      if (authorId) {
        await prisma.user.update({
          where: { id: authorId },
          data: { role: "USER", title: "[YASAKLI]", isOnline: false },
        });
        await prisma.notification.create({
          data: {
            userId: authorId,
            type: "ban",
            content: "Hesabınız yasaklanmıştır.",
          },
        });
      }
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { status },
      include: {
        reporter: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      report: updatedReport,
      message: "Rapor durumu güncellendi.",
    });
  } catch (error) {
    console.error("Rapor güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
