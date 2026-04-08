"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface DbUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  role: "USER" | "MOD" | "ADMIN";
  points: number;
  reputation: number;
  postCount: number;
  title: string | null;
  isOnline: boolean;
  rankId: string | null;
  rank: { id: string; name: string; icon: string; color: string } | null;
}

interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  dbUser: DbUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchDbUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      } else {
        setDbUser(null);
      }
    } catch {
      setDbUser(null);
    }
  }, []);

  useEffect(() => {
    // Use only onAuthStateChange to avoid concurrent getUser() calls
    // that cause cookie lock contention
    let initialDone = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSupabaseUser(user);
      if (user) {
        fetchDbUser().finally(() => {
          if (!initialDone) {
            initialDone = true;
            setLoading(false);
          }
        });
      } else {
        setDbUser(null);
        if (!initialDone) {
          initialDone = true;
          setLoading(false);
        }
      }
    });

    // Fallback: if onAuthStateChange doesn't fire within 2s, stop loading
    const timeout = setTimeout(() => {
      if (!initialDone) {
        initialDone = true;
        setLoading(false);
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase.auth, fetchDbUser]);

  // Heartbeat: update lastSeen every 5 minutes
  useEffect(() => {
    if (!supabaseUser) return;

    const heartbeat = () => {
      fetch("/api/auth/heartbeat", { method: "POST" }).catch(() => {});
    };

    heartbeat(); // initial
    const interval = setInterval(heartbeat, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [supabaseUser]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message.includes("Invalid login")) {
        return { error: "E-posta veya şifre hatalı" };
      }
      return { error: error.message };
    }
    await fetchDbUser();
    // Set online
    await fetch("/api/auth/online", { method: "POST", body: JSON.stringify({ online: true }) });
    return {};
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ): Promise<{ error?: string }> => {
    // First check username availability
    const checkRes = await fetch(
      `/api/auth/check-username?username=${encodeURIComponent(username)}`
    );
    const checkData = await checkRes.json();
    if (checkData.taken) {
      return { error: "Bu kullanıcı adı zaten kullanılıyor" };
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "Bu e-posta adresi zaten kayıtlı" };
      }
      return { error: error.message };
    }

    // Create DB user
    if (data.user) {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseId: data.user.id,
          email,
          username,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        return { error: d.error || "Kayıt sırasında bir hata oluştu" };
      }
    }

    await fetchDbUser();
    return {};
  };

  const logout = async () => {
    await fetch("/api/auth/online", {
      method: "POST",
      body: JSON.stringify({ online: false }),
    }).catch(() => {});
    await supabase.auth.signOut();
    setDbUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        supabaseUser,
        dbUser,
        loading,
        login,
        register,
        logout,
        refreshDbUser: fetchDbUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
