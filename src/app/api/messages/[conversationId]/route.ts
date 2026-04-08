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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify user is a participant
    const participation = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: dbUser.id },
    });

    if (!participation) {
      return NextResponse.json({ error: "Bu konuşmaya erişiminiz yok." }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // Mark unread messages from the other user as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: dbUser.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Mesaj listeleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
