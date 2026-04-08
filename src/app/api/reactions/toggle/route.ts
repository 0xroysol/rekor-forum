import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { onReactionAdded, onReactionRemoved } from "@/lib/utils/gamification";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 }
      );

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });
    if (!dbUser)
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );

    const { postId, emoji } = await request.json();

    if (!postId || !emoji) {
      return NextResponse.json(
        { error: "postId ve emoji gerekli" },
        { status: 400 }
      );
    }

    const existing = await prisma.reaction.findFirst({
      where: { postId, userId: dbUser.id, emoji },
    });

    let action: "added" | "removed";

    // Get post author for gamification
    const targetPost = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      action = "removed";
      // Reverse points
      if (targetPost && targetPost.authorId !== dbUser.id) {
        onReactionRemoved(targetPost.authorId, emoji).catch(() => {});
      }
    } else {
      await prisma.reaction.create({
        data: { postId, userId: dbUser.id, emoji },
      });
      action = "added";

      // Notify post author (don't notify self)
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, threadId: true } });
      if (post && post.authorId !== dbUser.id) {
        // Check if already notified for this post+user combo to avoid spam
        const existingNotif = await prisma.notification.findFirst({
          where: { userId: post.authorId, type: "reaction", relatedUserId: dbUser.id, relatedThreadId: post.threadId },
        });
        if (!existingNotif) {
          await prisma.notification.create({
            data: {
              userId: post.authorId,
              type: "reaction",
              content: `${dbUser.username} mesajınıza ${emoji} tepki verdi`,
              relatedThreadId: post.threadId,
              relatedUserId: dbUser.id,
            },
          });
        }
        // Award points to post author
        onReactionAdded(post.authorId, emoji).catch(() => {});
      }
    }

    // Get updated counts and user reactions
    const allReactions = await prisma.reaction.findMany({
      where: { postId },
    });

    const counts: Record<string, number> = {};
    const userReactions: string[] = [];

    for (const r of allReactions) {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
      if (r.userId === dbUser.id) {
        userReactions.push(r.emoji);
      }
    }

    return NextResponse.json({ action, counts, userReactions });
  } catch (error) {
    console.error("Reaction toggle error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
