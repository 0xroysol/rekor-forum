"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useAuth } from "@/providers/auth-provider";

interface PollOption {
  id: string;
  text: string;
  _count: { votes: number };
}

interface PollCardProps {
  poll: {
    id: string;
    question: string;
    endsAt: string | null;
    options: PollOption[];
  };
  totalVotes: number;
  userVotedOptionId: string | null;
}

export function PollCard({ poll, totalVotes, userVotedOptionId }: PollCardProps) {
  const { dbUser } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [votedOptionId, setVotedOptionId] = useState(userVotedOptionId);
  const [options, setOptions] = useState(poll.options);
  const [votes, setVotes] = useState(totalVotes);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isEnded = poll.endsAt ? new Date(poll.endsAt) < new Date() : false;
  const hasVoted = votedOptionId !== null;
  const showResults = hasVoted || isEnded || !dbUser;

  function getTimeRemaining() {
    if (!poll.endsAt) return "Süresiz";
    const diff = new Date(poll.endsAt).getTime() - Date.now();
    if (diff <= 0) return "Sona erdi";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days} gün ${hours} saat kaldı`;
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours} saat ${minutes} dk kaldı`;
    return `${minutes} dk kaldı`;
  }

  async function handleVote() {
    if (!selectedOption || !dbUser) return;
    setError("");

    // Optimistic update
    const prevOptions = options;
    const prevVotes = votes;
    const prevVotedId = votedOptionId;

    setVotedOptionId(selectedOption);
    setVotes((v) => v + 1);
    setOptions((opts) =>
      opts.map((o) =>
        o.id === selectedOption
          ? { ...o, _count: { votes: o._count.votes + 1 } }
          : o
      )
    );

    startTransition(async () => {
      try {
        const res = await fetch("/api/polls/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pollId: poll.id, optionId: selectedOption }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Oy verirken bir hata oluştu");
          // Rollback
          setOptions(prevOptions);
          setVotes(prevVotes);
          setVotedOptionId(prevVotedId);
          return;
        }

        const data = await res.json();
        setOptions(
          poll.options.map((o) => {
            const updated = data.options.find(
              (u: { id: string; voteCount: number }) => u.id === o.id
            );
            return updated
              ? { ...o, _count: { votes: updated.voteCount } }
              : o;
          })
        );
        setVotes(data.totalVotes);
        setVotedOptionId(data.userVotedOptionId);
      } catch {
        setError("Oy verirken bir hata oluştu");
        setOptions(prevOptions);
        setVotes(prevVotes);
        setVotedOptionId(prevVotedId);
      }
    });
  }

  return (
    <div
      style={{
        backgroundColor: "#131820",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: 16,
      }}
    >
      {/* Question */}
      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#e2e8f0",
          marginBottom: 12,
        }}
      >
        {poll.question}
      </h3>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 13,
            color: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          {error}
        </div>
      )}

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((option) => {
          const percentage = votes > 0 ? Math.round((option._count.votes / votes) * 100) : 0;
          const isUserVote = votedOptionId === option.id;

          if (showResults) {
            return (
              <div key={option.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: 40,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: isUserVote ? "#1f844e" : "#e2e8f0",
                      fontWeight: isUserVote ? 600 : 400,
                    }}
                  >
                    {isUserVote && (
                      <span style={{ marginRight: 6 }}>&#10003;</span>
                    )}
                    {option.text}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isUserVote ? "#1f844e" : "#94a3b8",
                    }}
                  >
                    {percentage}%
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: "#1e293b",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 9999,
                      backgroundColor: isUserVote ? "#1f844e" : "#1f844e80",
                      width: `${percentage}%`,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            );
          }

          // Voting mode - radio buttons
          return (
            <label
              key={option.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 40,
                cursor: "pointer",
                padding: "0 8px",
                borderRadius: 8,
                backgroundColor:
                  selectedOption === option.id ? "#1e2738" : "transparent",
                transition: "background-color 0.15s",
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `2px solid ${selectedOption === option.id ? "#1f844e" : "#1e293b"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "border-color 0.15s",
                }}
              >
                {selectedOption === option.id && (
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-green)",
                    }}
                  />
                )}
              </span>
              <input
                type="radio"
                name={`poll-${poll.id}`}
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => setSelectedOption(option.id)}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: 13, color: "#e2e8f0" }}>
                {option.text}
              </span>
            </label>
          );
        })}
      </div>

      {/* Vote button (only when not yet voted, not ended, and logged in) */}
      {!showResults && (
        <button
          onClick={handleVote}
          disabled={!selectedOption || isPending}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "8px 0",
            borderRadius: 8,
            border: "none",
            backgroundColor: selectedOption ? "#1f844e" : "#1e293b",
            color: selectedOption ? "#ffffff" : "#64748b",
            fontSize: 13,
            fontWeight: 600,
            cursor: selectedOption ? "pointer" : "default",
            transition: "all 0.15s",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? "Gönderiliyor..." : "Oy Ver"}
        </button>
      )}

      {/* Not logged in message */}
      {!dbUser && (
        <p
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "#64748b",
            textAlign: "center",
          }}
        >
          Oy vermek için giriş yapın
        </p>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <span>{votes} oy</span>
        <span>{getTimeRemaining()}</span>
      </div>
    </div>
  );
}
