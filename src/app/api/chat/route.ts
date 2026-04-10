import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";

// Server-side Supabase client for broadcasting (uses service role)
function getBroadcastClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
  role: true,
  rank: { select: { name: true, icon: true, color: true } },
} as const;

// GET /api/chat?room=genel&cursor=xxx&latest=id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomSlug = searchParams.get("room") || "genel";
  const cursor = searchParams.get("cursor");
  const latestId = searchParams.get("latest");

  // Fetch a specific message by id (used by realtime callback)
  if (latestId) {
    const msg = await prisma.chatMessage.findUnique({
      where: { id: latestId },
      include: { user: { select: USER_SELECT } },
    });
    return NextResponse.json({ messages: msg ? [msg] : [] });
  }

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

  // Broadcast to all clients in the room
  const sb = getBroadcastClient();
  const channel = sb.channel(`chat-room:${roomId}`);
  await channel.subscribe();
  await channel.send({ type: "broadcast", event: "new-message", payload: message });
  sb.removeChannel(channel);

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

  const msg = await prisma.chatMessage.findUnique({ where: { id }, select: { roomId: true } });
  await prisma.chatMessage.delete({ where: { id } });

  // Broadcast deletion
  if (msg) {
    const sb = getBroadcastClient();
    const channel = sb.channel(`chat-room:${msg.roomId}`);
    await channel.subscribe();
    await channel.send({ type: "broadcast", event: "delete-message", payload: { id } });
    sb.removeChannel(channel);
  }

  return NextResponse.json({ ok: true });
}
