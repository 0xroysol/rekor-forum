import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Leaderboard — always public
  const leaderboard = await prisma.user.findMany({
    where: { predictionPoints: { gt: 0 } },
    select: { id: true, username: true, avatar: true, predictionPoints: true },
    orderBy: { predictionPoints: "desc" },
    take: 20,
  });

  // User's own predictions — only if logged in
  let predictions: { matchId: string; homeScore: number; awayScore: number; points: number }[] = [];
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { id: true } });
    if (dbUser) {
      predictions = await prisma.prediction.findMany({
        where: { userId: dbUser.id },
        select: { matchId: true, homeScore: true, awayScore: true, points: true },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  return NextResponse.json({ leaderboard, predictions });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { id: true } });
  if (!dbUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const body = await request.json();
  const { predictions } = body as { predictions: { matchId: string; homeScore: number; awayScore: number }[] };

  if (!Array.isArray(predictions) || predictions.length === 0) {
    return NextResponse.json({ error: "Tahmin verisi gerekli" }, { status: 400 });
  }

  if (predictions.length > 50) {
    return NextResponse.json({ error: "Tek seferde en fazla 50 tahmin gönderilebilir" }, { status: 400 });
  }

  // Upsert each prediction
  const results = await prisma.$transaction(
    predictions.map((p) =>
      prisma.prediction.upsert({
        where: { userId_matchId: { userId: dbUser.id, matchId: p.matchId } },
        create: {
          userId: dbUser.id,
          matchId: p.matchId,
          homeScore: Math.max(0, Math.min(99, Math.round(p.homeScore))),
          awayScore: Math.max(0, Math.min(99, Math.round(p.awayScore))),
        },
        update: {
          homeScore: Math.max(0, Math.min(99, Math.round(p.homeScore))),
          awayScore: Math.max(0, Math.min(99, Math.round(p.awayScore))),
        },
      })
    )
  );

  return NextResponse.json({ success: true, count: results.length });
}
