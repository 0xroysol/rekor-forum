import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Oy vermek için giriş yapmanız gerekiyor" },
      { status: 401 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) {
    return NextResponse.json(
      { error: "Kullanıcı bulunamadı" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { pollId, optionId } = body;

  if (!pollId || !optionId) {
    return NextResponse.json(
      { error: "pollId ve optionId gereklidir" },
      { status: 400 }
    );
  }

  // Check poll exists and hasn't ended
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        include: { _count: { select: { votes: true } } },
      },
    },
  });

  if (!poll) {
    return NextResponse.json(
      { error: "Anket bulunamadı" },
      { status: 404 }
    );
  }

  if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
    return NextResponse.json(
      { error: "Bu anket sona ermiştir" },
      { status: 400 }
    );
  }

  // Check option belongs to this poll
  const option = poll.options.find((o) => o.id === optionId);
  if (!option) {
    return NextResponse.json(
      { error: "Geçersiz seçenek" },
      { status: 400 }
    );
  }

  // Check if user has already voted
  const existingVote = await prisma.pollVote.findUnique({
    where: {
      pollId_userId: {
        pollId,
        userId: dbUser.id,
      },
    },
  });

  if (existingVote) {
    return NextResponse.json(
      { error: "Bu ankete zaten oy verdiniz" },
      { status: 400 }
    );
  }

  // Create vote
  await prisma.pollVote.create({
    data: {
      pollId,
      optionId,
      userId: dbUser.id,
    },
  });

  // Fetch updated results
  const updatedOptions = await prisma.pollOption.findMany({
    where: { pollId },
    include: { _count: { select: { votes: true } } },
    orderBy: { position: "asc" },
  });

  const totalVotes = updatedOptions.reduce(
    (sum, opt) => sum + opt._count.votes,
    0
  );

  return NextResponse.json({
    options: updatedOptions.map((opt) => ({
      id: opt.id,
      text: opt.text,
      voteCount: opt._count.votes,
    })),
    totalVotes,
    userVotedOptionId: optionId,
  });
}
