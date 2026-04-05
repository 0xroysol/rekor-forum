"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface MockConversation {
  id: string;
  participant: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface MockMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
}

const mockConversations: MockConversation[] = [
  {
    id: "1",
    participant: "BetMaster42",
    avatar: "BM",
    lastMessage: "Galatasaray macinin analizi hazirladi...",
    time: "14:32",
    unread: 2,
  },
  {
    id: "2",
    participant: "SporGuru",
    avatar: "SG",
    lastMessage: "Tesekkurler, tahminlerin cok iyi!",
    time: "12:15",
    unread: 0,
  },
  {
    id: "3",
    participant: "CasinoKral",
    avatar: "CK",
    lastMessage: "Slot stratejisini paylasir misin?",
    time: "Dun",
    unread: 1,
  },
  {
    id: "4",
    participant: "TahminUzmani",
    avatar: "TU",
    lastMessage: "Bu hafta iddaa kuponum hazir",
    time: "Dun",
    unread: 0,
  },
  {
    id: "5",
    participant: "ForumMod",
    avatar: "FM",
    lastMessage: "Konun onaylandi, iyi paylasilar!",
    time: "2 gun once",
    unread: 0,
  },
];

const mockMessages: Record<string, MockMessage[]> = {
  "1": [
    {
      id: "m1",
      sender: "BetMaster42",
      content: "Selam, Galatasaray macini izledin mi dun gece?",
      time: "14:10",
      isMe: false,
    },
    {
      id: "m2",
      sender: "Ben",
      content:
        "Evet, cok iyi oynadilar! Ozellikle ikinci yari muhtesemdi.",
      time: "14:15",
      isMe: true,
    },
    {
      id: "m3",
      sender: "BetMaster42",
      content:
        "Katiliyorum. Ben bir analiz hazirliyorum forum icin. Sence nasil bir yaklasim izlemeliyim?",
      time: "14:20",
      isMe: false,
    },
    {
      id: "m4",
      sender: "Ben",
      content:
        "Istatistik agirlikli git bence. Topa sahip olma oranlari ve xG degerleri cok konusuluyor.",
      time: "14:25",
      isMe: true,
    },
    {
      id: "m5",
      sender: "BetMaster42",
      content:
        "Galatasaray macinin analizi hazirladi, bir goz atar misin yayin oncesi?",
      time: "14:32",
      isMe: false,
    },
  ],
  "2": [
    {
      id: "m6",
      sender: "SporGuru",
      content: "Bu hafta tahminlerin nasil gitti?",
      time: "11:45",
      isMe: false,
    },
    {
      id: "m7",
      sender: "Ben",
      content: "5/7 tutturduk, gayet iyi gecti!",
      time: "12:00",
      isMe: true,
    },
    {
      id: "m8",
      sender: "SporGuru",
      content: "Tesekkurler, tahminlerin cok iyi!",
      time: "12:15",
      isMe: false,
    },
  ],
};

export default function MesajlarPage() {
  const [selectedConvo, setSelectedConvo] = useState<string>("1");
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const currentMessages = mockMessages[selectedConvo] || [];
  const currentConvo = mockConversations.find((c) => c.id === selectedConvo);

  const filteredConversations = mockConversations.filter((c) =>
    c.participant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080a0f]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Mesajlar</h1>
          <Button className="bg-[#1f844e] text-white hover:bg-[#1f844e]/80">
            Yeni Mesaj
          </Button>
        </div>

        <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
          {/* Left Sidebar - Conversation List */}
          <Card className="flex flex-col border-none bg-[#131820] ring-white/5">
            <CardContent className="flex flex-col gap-2 p-3">
              <Input
                placeholder="Konusma ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-white/10 bg-[#0d1017] text-white placeholder:text-gray-500 focus-visible:border-[#1f844e] focus-visible:ring-[#1f844e]/30"
              />
            </CardContent>
            <Separator className="bg-white/5" />
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConvo(convo.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                    selectedConvo === convo.id ? "bg-white/10" : ""
                  }`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-[#0d1017] text-xs text-white">
                      {convo.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        {convo.participant}
                      </span>
                      <span className="text-xs text-gray-500">
                        {convo.time}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-400">
                      {convo.lastMessage}
                    </p>
                  </div>
                  {convo.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1f844e] text-[10px] font-bold text-white">
                      {convo.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Right Panel - Messages */}
          <Card className="flex flex-col border-none bg-[#131820] ring-white/5">
            {/* Conversation Header */}
            {currentConvo && (
              <>
                <CardHeader className="flex-row items-center gap-3 border-b border-white/5 py-3">
                  <Avatar>
                    <AvatarFallback className="bg-[#0d1017] text-xs text-white">
                      {currentConvo.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm text-white">
                      {currentConvo.participant}
                    </CardTitle>
                    <p className="text-xs text-gray-500">Cevrimici</p>
                  </div>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                          msg.isMe
                            ? "bg-[#1f844e] text-white"
                            : "bg-[#0d1017] text-gray-300"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`mt-1 text-right text-[10px] ${
                            msg.isMe ? "text-white/60" : "text-gray-500"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>

                {/* Message Input */}
                <div className="border-t border-white/5 p-4">
                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="Mesajinizi yazin..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={1}
                      className="min-h-[40px] border-white/10 bg-[#0d1017] text-white placeholder:text-gray-500 focus-visible:border-[#1f844e] focus-visible:ring-[#1f844e]/30"
                    />
                    <Button className="h-10 bg-[#1f844e] px-6 text-white hover:bg-[#1f844e]/80">
                      Gonder
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
