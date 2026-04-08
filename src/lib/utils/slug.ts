import prisma from "@/lib/prisma";

const TURKISH_MAP: Record<string, string> = {
  ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g",
  ü: "u", Ü: "u", ö: "o", Ö: "o", ı: "i", İ: "i",
};

function turkishToAscii(str: string): string {
  return str.replace(/[şŞçÇğĞüÜöÖıİ]/g, (c) => TURKISH_MAP[c] || c);
}

export function slugify(title: string): string {
  return turkishToAscii(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let counter = 2;

  while (await prisma.thread.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}
