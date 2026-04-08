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

const REPORTS_PER_PAGE = 20;

export async function GET(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }
    if (!isModOrAdmin(dbUser)) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);

    const where: Record<string, unknown> = {};
    if (status && ["PENDING", "REVIEWED", "RESOLVED"].includes(status)) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, username: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * REPORTS_PER_PAGE,
        take: REPORTS_PER_PAGE,
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        totalPages: Math.ceil(total / REPORTS_PER_PAGE),
        total,
      },
    });
  } catch (error) {
    console.error("Raporları listeleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const { type, targetId, reason, description } = await request.json();

    if (!type || !targetId || !reason) {
      return NextResponse.json(
        { error: "type, targetId ve reason alanları gereklidir." },
        { status: 400 }
      );
    }

    if (!["post", "thread"].includes(type)) {
      return NextResponse.json({ error: "Geçersiz rapor tipi." }, { status: 400 });
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: dbUser.id,
        type,
        targetId,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "Bu içerik için zaten bir raporunuz bulunmaktadır." },
        { status: 409 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: dbUser.id,
        type,
        targetId,
        reason: description ? `${reason}: ${description}` : reason,
        status: "PENDING",
      },
    });

    return NextResponse.json({ report, message: "Rapor başarıyla oluşturuldu." }, { status: 201 });
  } catch (error) {
    console.error("Rapor oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
