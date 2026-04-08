import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json();
  const online = body.online === true;

  await prisma.user.updateMany({
    where: { email: user.email! },
    data: {
      isOnline: online,
      lastSeen: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
