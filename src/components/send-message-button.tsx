"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

interface SendMessageButtonProps {
  username: string;
}

export default function SendMessageButton({ username }: SendMessageButtonProps) {
  const { dbUser } = useAuth();
  const router = useRouter();

  // Don't show if not logged in or viewing own profile
  if (!dbUser || dbUser.username === username) {
    return null;
  }

  return (
    <button
      onClick={() => router.push(`/mesajlar?to=${encodeURIComponent(username)}`)}
      className="rounded-md border border-[#1e293b] px-3 py-1.5 text-sm text-[#94a3b8] transition-colors hover:bg-[#1e2738]"
    >
      Mesaj Gonder
    </button>
  );
}
