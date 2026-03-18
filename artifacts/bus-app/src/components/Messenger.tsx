import { useState, useEffect, useRef } from "react";
import { type UserSession, type Partner } from "@/App";
import { useStore } from "@/hooks/useStore";

interface ChatMessage {
  id: string;
  from: string;
  fromName: string;
  to: string | null;
  text: string;
  timestamp: number;
}

interface Props {
  session: UserSession;
  partners: Partner[];
}

const MASTER_ID = "MASTER";
const MASTER_NAME = "Master Dispatch";

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  return `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} ${time}`;
}

export default function Messenger({ session, partners }: Props) {
  const [messages, setMessages] = useStore<ChatMessage[]>("messages", []);
  const [activeConv, setActiveConv] = useState<string | null>("group");
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const myId   = session.role === "master" ? MASTER_ID : session.partnerId || session.name;
  const myName = session.role === "master" ? MASTER_NAME : session.name;

  // All known users for conversation list
  const allUsers: { id: string; name: string }[] = [
    { id: MASTER_ID, name: MASTER_NAME },
    ...partners.map(p => ({ id: p.id, name: p.name })),
  ];

  function convMessages(): ChatMessage[] {
    if (activeConv === "group") {
      return messages.filter(m => m.to === null);
    }
    return messages.filter(m =>
      (m.to === activeConv && m.from === myId) ||
      (m.to === myId && m.from === activeConv)
    );
  }

  function unread(convId: string): number {
    if (convId === "group") {
      return messages.filter(m => m.to === null && m.from !== myId).length;
    }
    return messages.filter(m => m.to === myId && m.from === convId).length;
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from: myId,
      fromName: myName,
      to: activeConv === "group" ? null : activeConv,
      text: text.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    setText("");
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConv]);

  const convMsgs = convMessages();
  const otherUser = activeConv !== "group" ? allUsers.find(u => u.id === activeConv) : null;

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] gold-border rounded-2xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-white/[0.06] bg-[#050505] flex flex-col">
        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Messenger</p>
          <p className="text-sm font-semibold text-white mt-0.5">{myName}</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Group chat */}
          <button
            onClick={() => setActiveConv("group")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
              activeConv === "group" ? "bg-yellow-500/10 border-r-2 border-yellow-500" : "hover:bg-white/[0.03]"
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-sm flex-shrink-0">
              🚌
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">Gruppen-Chat</p>
              <p className="text-[10px] text-zinc-600 truncate">Alle Benutzer</p>
            </div>
            {unread("group") > 0 && (
              <span className="w-4 h-4 rounded-full bg-yellow-500 text-black text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                {unread("group") > 9 ? "9+" : unread("group")}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="px-4 py-2">
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest">Direkt</p>
          </div>

          {/* Individual conversations */}
          {allUsers
            .filter(u => u.id !== myId)
            .map(u => (
              <button
                key={u.id}
                onClick={() => setActiveConv(u.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                  activeConv === u.id ? "bg-yellow-500/10 border-r-2 border-yellow-500" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                  <p className="text-[10px] text-zinc-600">{u.id}</p>
                </div>
                {unread(u.id) > 0 && (
                  <span className="w-4 h-4 rounded-full bg-yellow-500 text-black text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                    {unread(u.id) > 9 ? "9+" : unread(u.id)}
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[#080808]">
        {/* Chat header */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3 bg-[#050505]">
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-sm flex-shrink-0">
            {activeConv === "group" ? "🚌" : (otherUser?.name.slice(0, 2).toUpperCase() || "?")}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {activeConv === "group" ? "Gruppen-Chat" : otherUser?.name}
            </p>
            <p className="text-[10px] text-zinc-600">
              {activeConv === "group" ? `${allUsers.length} Teilnehmer` : "Privat"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {convMsgs.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-zinc-700 text-center">
                {activeConv === "group"
                  ? "Noch keine Nachrichten im Gruppen-Chat."
                  : `Starte eine Unterhaltung mit ${otherUser?.name}.`}
              </p>
            </div>
          )}
          {convMsgs.map(m => {
            const isMe = m.from === myId;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="text-[10px] text-zinc-600 mb-0.5 px-1">{m.fromName}</span>
                )}
                <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-100 rounded-tr-sm"
                    : "bg-white/[0.06] border border-white/[0.08] text-zinc-200 rounded-tl-sm"
                }`}>
                  {m.text}
                </div>
                <span className="text-[10px] text-zinc-700 mt-0.5 px-1">{formatTime(m.timestamp)}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06]">
          <form onSubmit={send} className="flex gap-3">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={activeConv === "group" ? "Nachricht an alle..." : `Nachricht an ${otherUser?.name || ""}...`}
              className="flex-1 px-4 py-2.5 bg-black border border-white/10 rounded-xl text-white text-sm outline-none focus:border-yellow-500/40 placeholder-zinc-700"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 text-black font-bold text-sm rounded-xl disabled:opacity-30 hover:shadow-[0_4px_15px_rgba(201,162,39,0.3)] transition-all"
            >
              Senden
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
