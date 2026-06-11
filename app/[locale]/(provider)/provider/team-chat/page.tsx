"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useParams } from "next/navigation";

interface Msg { id: string; senderId: string; senderName: string; content: string; type: string; createdAt: string; isMe: boolean; }

function TeamChatContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [channel, setChannel] = useState("general");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    fetch("/api/provider/team-messages?channel=" + channel)
      .then(r => r.json())
      .then(d => { if (d.success) setMessages(d.messages || []); });
  };

  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [channel]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await fetch("/api/provider/team-messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input, channel }),
    });
    setInput(""); setSending(false); load();
  };

  const CHANNELS = [
    { id: "general", icon: "\ud83d\udcac", label: isZh ? "\u5168\u4f53" : "General" },
    { id: "prayer", icon: "\ud83d\ude4f", label: isZh ? "\u4ee3\u7977" : "Prayer" },
    { id: "logistics", icon: "\ud83d\udce6", label: isZh ? "\u534f\u8c03" : "Logistics" },
  ];

  return (
    <main className="max-w-lg mx-auto flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{isZh ? "\u56e2\u961f\u804a\u5929" : "Team Chat"}</h1>
        <div className="flex gap-2">
          {CHANNELS.map(c => (
            <button key={c.id} onClick={() => setChannel(c.id)}
              className={"px-3 py-1.5 rounded-full text-sm font-medium " + (channel === c.id ? "bg-purple-100 text-purple-700 border-2 border-purple-300" : "bg-gray-100 text-gray-500 border-2 border-transparent")}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12"><p className="text-5xl mb-4">\ud83d\udc4b</p><p className="text-xl text-gray-400">{isZh ? "\u5f00\u59cb\u5bf9\u8bdd\u5427" : "Start the conversation"}</p></div>
        ) : messages.map(m => (
          <div key={m.id} className={"flex " + (m.isMe ? "justify-end" : "justify-start")}>
            <div className={"max-w-[75%] rounded-2xl px-4 py-3 " + (m.isMe ? "bg-purple-600 text-white" : "bg-white border border-gray-200")}>
              {!m.isMe && <p className="text-xs font-medium text-purple-600 mb-1">{m.senderName}</p>}
              <p className={"text-base " + (m.isMe ? "text-white" : "text-gray-800")}>{m.content}</p>
              <p className={"text-xs mt-1 " + (m.isMe ? "text-purple-200" : "text-gray-400")}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(); }}
          placeholder={isZh ? "\u8f93\u5165\u6d88\u606f..." : "Type a message..."}
          className="flex-1 p-3 border border-gray-300 rounded-xl text-lg" />
        <button onClick={send} disabled={sending || !input.trim()}
          className="px-5 py-3 bg-purple-600 text-white rounded-xl text-lg font-bold disabled:opacity-50">
          {isZh ? "\u53d1\u9001" : "Send"}
        </button>
      </div>
    </main>
  );
}

export default function TeamChatPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><TeamChatContent /></Suspense>; }
