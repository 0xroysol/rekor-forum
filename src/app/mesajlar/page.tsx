"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

interface OtherUser {
  id: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
}

interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; username: string };
}

interface Conversation {
  id: string;
  otherUser: OtherUser | null;
  lastMessage: LastMessage | null;
  updatedAt: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; username: string; avatar: string | null };
}

interface SearchUser {
  id: string;
  username: string;
  avatar: string | null;
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Dun";
  if (diffDays < 7) return `${diffDays} gun once`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MesajlarPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const toUsername = searchParams.get("to");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // New message modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMsgSearch, setNewMsgSearch] = useState("");
  const [newMsgUsers, setNewMsgUsers] = useState<SearchUser[]>([]);
  const [newMsgSelectedUser, setNewMsgSelectedUser] = useState<SearchUser | null>(null);
  const [newMsgContent, setNewMsgContent] = useState("");
  const [newMsgSearching, setNewMsgSearching] = useState(false);
  const [newMsgSending, setNewMsgSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toHandledRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!dbUser) return;
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      // ignore
    } finally {
      setLoadingConvos(false);
    }
  }, [dbUser]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (convoId: string) => {
      if (!dbUser) return;
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages/${convoId}`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {
        // ignore
      } finally {
        setLoadingMessages(false);
      }
    },
    [dbUser]
  );

  // Initial load
  useEffect(() => {
    if (dbUser) {
      fetchConversations();
    }
  }, [dbUser, fetchConversations]);

  // Handle ?to=USERNAME param
  useEffect(() => {
    if (!toUsername || !dbUser || toHandledRef.current || loadingConvos) return;
    toHandledRef.current = true;

    // Check if we already have a conversation with this user
    const existingConvo = conversations.find(
      (c) => c.otherUser?.username.toLowerCase() === toUsername.toLowerCase()
    );

    if (existingConvo) {
      setSelectedConvoId(existingConvo.id);
    } else {
      // Send a placeholder to open a new conversation flow - just set up the new message modal
      setShowNewModal(true);
      setNewMsgSearch(toUsername);
      // Trigger search for this user
      (async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(toUsername)}`);
          if (res.ok) {
            const data = await res.json();
            const users: SearchUser[] = data.users || [];
            setNewMsgUsers(users);
            const match = users.find(
              (u: SearchUser) => u.username.toLowerCase() === toUsername.toLowerCase()
            );
            if (match) {
              setNewMsgSelectedUser(match);
            }
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [toUsername, dbUser, conversations, loadingConvos]);

  // When selecting a conversation, fetch messages
  useEffect(() => {
    if (selectedConvoId) {
      fetchMessages(selectedConvoId);
    }
  }, [selectedConvoId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Polling: refetch messages every 10 seconds
  useEffect(() => {
    if (!selectedConvoId || !dbUser) return;
    const interval = setInterval(() => {
      fetchMessages(selectedConvoId);
      fetchConversations(); // also refresh conversation list for unread counts
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedConvoId, dbUser, fetchMessages, fetchConversations]);

  // Calculate unread count for a conversation
  const getUnreadCount = useCallback(
    (convo: Conversation): number => {
      // We don't have per-message readAt from the list endpoint,
      // so we'll track it from messages if it's the selected conversation.
      // For now, use the unreadCount if provided.
      if (convo.unreadCount !== undefined) return convo.unreadCount;
      return 0;
    },
    []
  );

  // Send message in existing conversation
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvoId || sending) return;
    const content = newMessage.trim();
    setSending(true);
    setNewMessage("");

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConvoId,
      senderId: dbUser!.id,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
      sender: { id: dbUser!.id, username: dbUser!.username, avatar: dbUser!.avatar || null },
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvoId, content }),
      });
      if (res.ok) {
        // Refresh messages to get the real message
        await fetchMessages(selectedConvoId);
        await fetchConversations();
      }
    } catch {
      // Revert optimistic update on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // New message modal: search users
  useEffect(() => {
    if (!newMsgSearch.trim() || newMsgSearch.trim().length < 2) {
      setNewMsgUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setNewMsgSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(newMsgSearch.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out current user from results
          setNewMsgUsers(
            (data.users || []).filter((u: SearchUser) => u.id !== dbUser?.id)
          );
        }
      } catch {
        // ignore
      } finally {
        setNewMsgSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newMsgSearch, dbUser?.id]);

  // Send new message (from modal)
  const handleNewMsgSend = async () => {
    if (!newMsgSelectedUser || !newMsgContent.trim() || newMsgSending) return;
    setNewMsgSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUsername: newMsgSelectedUser.username,
          content: newMsgContent.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Close modal and select the conversation
        setShowNewModal(false);
        setNewMsgSearch("");
        setNewMsgUsers([]);
        setNewMsgSelectedUser(null);
        setNewMsgContent("");
        await fetchConversations();
        setSelectedConvoId(data.conversationId);
      }
    } catch {
      // ignore
    } finally {
      setNewMsgSending(false);
    }
  };

  const selectedConvo = conversations.find((c) => c.id === selectedConvoId);
  const filteredConversations = conversations.filter((c) =>
    c.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auth loading state
  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!dbUser) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border border-[#1e293b] bg-[#131820] p-12 text-center">
          <p className="text-[#94a3b8]">
            Mesajlari goruntulemek icin{" "}
            <Link href="/giris" className="text-[#1f844e] hover:underline">
              giris yapin
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Mesajlar</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="rounded-md bg-[#1f844e] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f844e]/80"
        >
          Yeni Mesaj
        </button>
      </div>

      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        {/* Left Sidebar - Conversation List */}
        <div className="flex flex-col rounded-xl border border-[#1e293b] bg-[#131820]">
          <div className="p-3">
            <input
              placeholder="Konusma ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
            />
          </div>
          <div className="border-t border-[#1e293b]" />
          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#64748b]">
                {searchQuery ? "Sonuc bulunamadi." : "Henuz konusma yok."}
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const unread = getUnreadCount(convo);
                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvoId(convo.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selectedConvoId === convo.id
                        ? "bg-[#1a2130]"
                        : "hover:bg-[#1e2738]"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0d1017] text-xs font-medium text-[#e2e8f0]">
                      {convo.otherUser ? getInitials(convo.otherUser.username) : "?"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#e2e8f0]">
                          {convo.otherUser?.username || "Bilinmeyen"}
                        </span>
                        <span className="text-xs text-[#64748b]">
                          {convo.lastMessage
                            ? formatTime(convo.lastMessage.createdAt)
                            : formatTime(convo.updatedAt)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-[#94a3b8]">
                        {convo.lastMessage?.content || "Henuz mesaj yok"}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1f844e] text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Messages */}
        <div className="flex flex-col rounded-xl border border-[#1e293b] bg-[#131820]">
          {selectedConvo ? (
            <>
              {/* Conversation Header */}
              <div className="flex items-center gap-3 border-b border-[#1e293b] px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d1017] text-xs font-medium text-[#e2e8f0]">
                  {selectedConvo.otherUser
                    ? getInitials(selectedConvo.otherUser.username)
                    : "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e2e8f0]">
                    {selectedConvo.otherUser?.username || "Bilinmeyen"}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {selectedConvo.otherUser?.isOnline
                      ? "Cevrimici"
                      : "Cevrimdisi"}
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f844e] border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-sm text-[#64748b]">
                    Henuz mesaj yok. Bir mesaj gonderin!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === dbUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                            isMe
                              ? "bg-[#1f844e] text-white"
                              : "bg-[#1a2130] text-[#94a3b8]"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`mt-1 text-right text-[10px] ${
                              isMe ? "text-white/60" : "text-[#64748b]"
                            }`}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-[#1e293b] p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    placeholder="Mesajinizi yazin..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="min-h-[40px] flex-1 resize-none rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="h-10 rounded-md bg-[#1f844e] px-6 text-sm font-medium text-white transition-colors hover:bg-[#1f844e]/80 disabled:opacity-50"
                  >
                    Gonder
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[#64748b]">
              Bir konusma secin veya yeni mesaj gonderin.
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-md rounded-xl border border-[#1e293b] bg-[#131820] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#e2e8f0]">Yeni Mesaj</h2>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setNewMsgSearch("");
                  setNewMsgUsers([]);
                  setNewMsgSelectedUser(null);
                  setNewMsgContent("");
                }}
                className="text-[#64748b] transition-colors hover:text-[#e2e8f0]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* User search */}
            {!newMsgSelectedUser ? (
              <div>
                <label className="mb-1 block text-sm text-[#94a3b8]">
                  Alici
                </label>
                <input
                  placeholder="Kullanici adi ara..."
                  value={newMsgSearch}
                  onChange={(e) => {
                    setNewMsgSearch(e.target.value);
                    setNewMsgSelectedUser(null);
                  }}
                  className="w-full rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
                  autoFocus
                />
                {newMsgSearching && (
                  <div className="mt-2 text-xs text-[#64748b]">Araniyor...</div>
                )}
                {newMsgUsers.length > 0 && (
                  <div className="mt-2 rounded-md border border-[#1e293b] bg-[#0d1017]">
                    {newMsgUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setNewMsgSelectedUser(user);
                          setNewMsgSearch(user.username);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#e2e8f0] transition-colors hover:bg-[#1e2738]"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a2130] text-[10px] font-medium text-[#e2e8f0]">
                          {getInitials(user.username)}
                        </div>
                        {user.username}
                      </button>
                    ))}
                  </div>
                )}
                {newMsgSearch.trim().length >= 2 &&
                  !newMsgSearching &&
                  newMsgUsers.length === 0 && (
                    <div className="mt-2 text-xs text-[#64748b]">
                      Kullanici bulunamadi.
                    </div>
                  )}
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm text-[#94a3b8]">
                  Alici
                </label>
                <div className="flex items-center gap-2 rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a2130] text-[10px] font-medium text-[#e2e8f0]">
                    {getInitials(newMsgSelectedUser.username)}
                  </div>
                  <span className="flex-1 text-sm text-[#e2e8f0]">
                    {newMsgSelectedUser.username}
                  </span>
                  <button
                    onClick={() => {
                      setNewMsgSelectedUser(null);
                      setNewMsgSearch("");
                      setNewMsgUsers([]);
                    }}
                    className="text-[#64748b] transition-colors hover:text-[#e2e8f0]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Message content */}
            <div className="mt-4">
              <label className="mb-1 block text-sm text-[#94a3b8]">
                Mesaj
              </label>
              <textarea
                placeholder="Mesajinizi yazin..."
                value={newMsgContent}
                onChange={(e) => setNewMsgContent(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-md border border-[#1e293b] bg-[#0d1017] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#1f844e] focus:outline-none focus:ring-1 focus:ring-[#1f844e]/30"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setNewMsgSearch("");
                  setNewMsgUsers([]);
                  setNewMsgSelectedUser(null);
                  setNewMsgContent("");
                }}
                className="rounded-md border border-[#1e293b] px-4 py-2 text-sm text-[#94a3b8] transition-colors hover:bg-[#1e2738]"
              >
                Iptal
              </button>
              <button
                onClick={handleNewMsgSend}
                disabled={!newMsgSelectedUser || !newMsgContent.trim() || newMsgSending}
                className="rounded-md bg-[#1f844e] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f844e]/80 disabled:opacity-50"
              >
                {newMsgSending ? "Gonderiliyor..." : "Gonder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
