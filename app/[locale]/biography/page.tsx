"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function BiographyPage() {
  const { locale } = useParams();
  const isZh = locale === "zh";
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(()=>{fetch("/api/ai/biography").then(r=>r.json()).then(setProgress).catch(()=>{});},[]);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/ai/biography", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({transcript,sessionTitle:title||undefined})});
    const data = await res.json(); setResult(data); setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-3xl mx-auto pt-8">
        <h1 className="text-3xl font-bold text-amber-800 mb-2">{isZh?"📖 人生传记引擎":"📖 Digital Autobiography Engine"}</h1>
        <p className="text-amber-600 mb-8">{isZh?"将您的故事转化为家族遗产":"Transform stories into treasured heritage"}</p>
        {progress&&<div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex justify-between text-sm"><span>{isZh?"章节":"Chapters"}: {progress.sessionsCompleted||0}</span><span>Tokens: {((progress.tokensConsumed||0)/1000).toFixed(0)}K / {((progress.maxTokens||500000)/1000).toFixed(0)}K</span></div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="bg-amber-500 rounded-full h-2" style={{width:`${((progress.tokensConsumed||0)/(progress.maxTokens||500000))*100}%`}}/></div>
        </div>}
        <div className="bg-white rounded-xl shadow p-6">
          <input placeholder={isZh?"章节标题":"Chapter Title (optional)"} value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-4 py-3 border rounded-lg mb-4"/>
          <textarea placeholder={isZh?"粘贴访谈记录或口述故事...":"Paste interview transcript or dictated story..."} value={transcript} onChange={e=>setTranscript(e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={8}/>
          <button onClick={generate} disabled={loading||!transcript.trim()} className="w-full mt-4 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50">{loading?"...":(isZh?"生成章节":"Generate Chapter")}</button>
        </div>
        {result?.success&&<div className="bg-white rounded-xl shadow p-6 mt-6 border-l-4 border-amber-500">
          <h3 className="font-semibold text-amber-800 mb-2">{isZh?"章节预览":"Chapter Preview"}</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{result.chapterExcerpt}</p>
          <p className="text-sm text-gray-400 mt-4">Tokens: {result.tokensUsed}</p>
        </div>}
      </div>
    </main>);
}
