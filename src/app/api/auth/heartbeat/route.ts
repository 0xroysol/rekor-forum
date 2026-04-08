import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await prisma.user.updateMany({
    where: { email: user.email! },
    data: { lastSeen: new Date(), isOnline: true },
  });

  return NextResponse.json({ ok: true });
}
