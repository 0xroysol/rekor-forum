import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
  role: true,
  rank: { select: { name: true, icon: true, color: true } },
} as const;

// GET /api/chat?room=genel&cursor=xxx&after=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomSlug = searchParams.get("room") || "genel";
  const cursor = searchParams.get("cursor");
  const after = searchParams.get("after");

  // Poll: fetch messages newer than a timestamp
  if (after) {
    const messages = await prisma.chatMessage.findMany({
      where: { roomId: roomSlug, createdAt: { gt: new Date(after) } },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: { user: { select: USER_SELECT } },
    });
    return NextResponse.json({ messages });
  }

  // Initial load or older messages (cursor-based)
  const limit = 100;
  const messages = await prisma.chatMessage.findMany({
    where: {
      roomId: roomSlug,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: USER_SELECT } },
  });

  return NextResponse.json({ messages: messages.reverse() });
}

// POST /api/chat — send message
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { id: true, username: true } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Rate limit: 1 message per 3 seconds
  const rl = rateLimit(`chat:${dbUser.id}`, 1, 3000);
  if (!rl.allowed) return NextResponse.json({ error: "Çok hızlı mesaj gönderiyorsunuz" }, { status: 429 });

  const body = await request.json();
  const content = (body.content || "").trim();
  const roomId = body.roomId || "genel";

  if (!content || content.length > 500) {
    return NextResponse.json({ error: "Mesaj 1-500 karakter olmalı" }, { status: 400 });
  }

  // Flood protection: prevent same message consecutively
  const lastMsg = await prisma.chatMessage.findFirst({
    where: { userId: dbUser.id, roomId },
    orderBy: { createdAt: "desc" },
  });
  if (lastMsg && lastMsg.content === content) {
    return NextResponse.json({ error: "Aynı mesajı tekrar gönderemezsiniz" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: { userId: dbUser.id, roomId, content },
    include: { user: { select: USER_SELECT } },
  });

  return NextResponse.json({ message });
}

// DELETE /api/chat?id=xxx — mod/admin delete
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { id: true, role: true } });
  if (!dbUser || (dbUser.role !== "MOD" && dbUser.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.chatMessage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
