import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const prefixes = await prisma.prefix.findMany();
  return NextResponse.json(prefixes);
}
