import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rate-limit";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { email: user.email! } });
}

export async function GET() {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: dbUser.id },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: { not: dbUser.id } },
              include: {
                user: {
                  select: { id: true, username: true, avatar: true, isOnline: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: {
                  select: { id: true, username: true },
                },
              },
            },
          },
        },
      },
    });

    const conversations = participations
      .map((p) => ({
        id: p.conversation.id,
        otherUser: p.conversation.participants[0]?.user || null,
        lastMessage: p.conversation.messages[0] || null,
        updatedAt: p.conversation.messages[0]?.createdAt || p.conversation.createdAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Konuşma listeleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const { conversationId, recipientUsername, content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Mesaj içeriği gereklidir." }, { status: 400 });
    }

    // Rate limit: 1 message per 10 seconds
    const rl = rateLimit(`msg_send_${dbUser.id}`, 1, 10_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Çok hızlı mesaj gönderiyorsunuz." }, { status: 429 });
    }

    let targetConversationId = conversationId;
    let recipientId: string | null = null;

    if (!conversationId) {
      if (!recipientUsername) {
        return NextResponse.json(
          { error: "conversationId veya recipientUsername gereklidir." },
          { status: 400 }
        );
      }

      const recipient = await prisma.user.findUnique({
        where: { username: recipientUsername },
      });

      if (!recipient) {
        return NextResponse.json({ error: "Alıcı kullanıcı bulunamadı." }, { status: 404 });
      }

      if (recipient.id === dbUser.id) {
        return NextResponse.json({ error: "Kendinize mesaj gönderemezsiniz." }, { status: 400 });
      }

      recipientId = recipient.id;

      // Find existing conversation between these two users
      const existingParticipation = await prisma.conversationParticipant.findFirst({
        where: {
          userId: dbUser.id,
          conversation: {
            participants: {
              some: { userId: recipient.id },
            },
          },
        },
        select: { conversationId: true },
      });

      if (existingParticipation) {
        targetConversationId = existingParticipation.conversationId;
      } else {
        const newConversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [{ userId: dbUser.id }, { userId: recipient.id }],
            },
          },
        });
        targetConversationId = newConversation.id;
      }
    } else {
      // Verify user is participant of this conversation
      const participation = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: dbUser.id },
      });
      if (!participation) {
        return NextResponse.json({ error: "Bu konuşmaya erişiminiz yok." }, { status: 403 });
      }

      // Find the other participant for notification
      const otherParticipant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: { not: dbUser.id } },
      });
      recipientId = otherParticipant?.userId || null;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: targetConversationId,
        senderId: dbUser.id,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // Create notification for recipient
    if (recipientId) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: "new_message",
          content: `${dbUser.username} size bir mesaj gönderdi.`,
          relatedUserId: dbUser.id,
        },
      });
    }

    return NextResponse.json({ message, conversationId: targetConversationId }, { status: 201 });
  } catch (error) {
    console.error("Mesaj gönderme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
