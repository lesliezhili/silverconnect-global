"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams } from "next/navigation";

interface Message { id: string; sender_id: string; sender_name: string; content: string; message_type: string; created_at: string; }

function ChatContent() {
  const params = useParams();
  const bookingId = params?.bookingId as string;
  const locale = (params?.locale as string) || "en";
  const isZh = locale === "zh";

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => {
    fetch("/api/messages?bookingId=" + bookingId)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMessages(data.messages || []);
          setCurrentUserId(data.currentUserId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (type = "text") => {
    if (!input.trim()) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, content: input.trim(), type }),
    });
    setInput("");
    setSending(false);
    fetchMessages();
  };

  const sendPrayer = () => {
    const prayer = isZh ? "\ud83d\ude4f 我为你祷告。愿神赐你平安和力量。" : "\ud83d\ude4f I am praying for you. May God grant you peace and strength.";
    setInput(prayer);
  };

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "加载中..." : "Loading..."}</div>;

  return (
    <main className="flex flex-col h-[calc(100vh-80px)] max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-emerald-700 text-white p-4 text-center">
        <h1 className="text-xl font-bold">{isZh ? "消息" : "Messages"}</h1>
        <p className="text-sm opacity-80">{isZh ? "与您的志愿者/长辈对话" : "Chat with your volunteer/senior"}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-lg">{isZh ? "开始对话吧！" : "Start the conversation!"}</p>
            <p className="text-base mt-2">{isZh ? "发送消息安排您的服务详情" : "Send a message to arrange service details"}</p>
          </div>
        )}
        {messages.map(m => {
          const isMine = m.sender_id === currentUserId;
          const isPrayer = m.message_type === "prayer";
          return (
            <div key={m.id} className={"flex " + (isMine ? "justify-end" : "justify-start")}>
              <div className={"max-w-[80%] rounded-2xl px-4 py-3 " +
                (isPrayer ? "bg-purple-100 border border-purple-200" :
                isMine ? "bg-emerald-600 text-white" : "bg-white border border-gray-200")}>
                {!isMine && <p className={"text-sm font-medium mb-1 " + (isPrayer ? "text-purple-700" : "text-gray-500")}>{m.sender_name}</p>}
                <p className={"text-lg " + (isMine && !isPrayer ? "text-white" : "text-gray-800")}>{m.content}</p>
                <p className={"text-xs mt-1 " + (isMine ? "text-emerald-200" : "text-gray-400")}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 px-4 py-2 bg-white border-t border-gray-100">
        <button onClick={sendPrayer} className="px-3 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
          \ud83d\ude4f {isZh ? "祷告" : "Prayer"}
        </button>
        <button onClick={() => setInput(isZh ? "我已到达，请开门。" : "I have arrived. Please open the door.")}
          className="px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
          {isZh ? "已到达" : "Arrived"}
        </button>
        <button onClick={() => setInput(isZh ? "我会迟到约10分钟，抱歉！" : "I will be about 10 minutes late. Sorry!")}
          className="px-3 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
          {isZh ? "迟到" : "Running late"}
        </button>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={isZh ? "输入消息..." : "Type a message..."}
          className="flex-1 p-4 border border-gray-300 rounded-xl text-lg min-h-[56px]" />
        <button onClick={() => send()} disabled={!input.trim() || sending}
          className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-lg font-bold rounded-xl min-h-[56px]">
          {isZh ? "发送" : "Send"}
        </button>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><ChatContent /></Suspense>;
}
