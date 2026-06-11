"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

const STEPS = [
  { id: "welcome", icon: "\ud83d\udc4b", title: "Welcome!", titleZh: "\u6b22\u8fce\uff01", desc: "Welcome to SilverConnect Faith Ministry. You're about to begin a meaningful journey serving seniors in your community.", descZh: "\u6b22\u8fce\u6765\u5230\u548c\u6da6\u4fe1\u4ef0\u4e8b\u5de5\u3002\u60a8\u5373\u5c06\u5f00\u59cb\u4e00\u6bb5\u670d\u52a1\u793e\u533a\u957f\u8005\u7684\u6709\u610f\u4e49\u65c5\u7a0b\u3002" },
  { id: "profile_setup", icon: "\ud83d\udcdd", title: "Your Profile", titleZh: "\u4e2a\u4eba\u8d44\u6599", desc: "Your profile helps seniors feel comfortable before a visit. Add your church, ministry experience, and a friendly photo.", descZh: "\u60a8\u7684\u8d44\u6599\u5e2e\u52a9\u957f\u8005\u5728\u63a2\u8bbf\u524d\u611f\u5230\u653e\u5fc3\u3002\u8bf7\u6dfb\u52a0\u6559\u4f1a\u3001\u4e8b\u5de5\u7ecf\u5386\u548c\u7167\u7247\u3002", action: "/provider/register-faith" },
  { id: "schedule_intro", icon: "\ud83d\udcc5", title: "Set Your Schedule", titleZh: "\u8bbe\u7f6e\u65e5\u7a0b", desc: "Tell us when you're available. You can change this anytime. Seniors will only see times you've marked as available.", descZh: "\u544a\u8bc9\u6211\u4eec\u60a8\u4f55\u65f6\u6709\u7a7a\u3002\u957f\u8005\u53ea\u4f1a\u770b\u5230\u60a8\u6807\u8bb0\u4e3a\u53ef\u7528\u7684\u65f6\u95f4\u3002", action: "/provider/faith-schedule" },
  { id: "first_booking", icon: "\ud83e\udd1d", title: "Your First Visit", titleZh: "\u7b2c\u4e00\u6b21\u63a2\u8bbf", desc: "When a senior books you, you'll get a notification. Arrive on time, be warm, and listen with care.", descZh: "\u5f53\u957f\u8005\u9884\u7ea6\u60a8\u65f6\uff0c\u60a8\u4f1a\u6536\u5230\u901a\u77e5\u3002\u51c6\u65f6\u5230\u8fbe\uff0c\u8010\u5fc3\u503e\u542c\u3002" },
  { id: "prayer_report_intro", icon: "\ud83d\ude4f", title: "Prayer Reports", titleZh: "\u7977\u544a\u62a5\u544a", desc: "After each visit, submit a brief prayer report. This helps the team pray and provides continuity for follow-up visits.", descZh: "\u6bcf\u6b21\u63a2\u8bbf\u540e\u63d0\u4ea4\u7b80\u77ed\u7684\u7977\u544a\u62a5\u544a\u3002\u8fd9\u5e2e\u52a9\u56e2\u961f\u4ee3\u7977\u5e76\u4e3a\u540e\u7eed\u63a2\u8bbf\u63d0\u4f9b\u8fde\u7eed\u6027\u3002", action: "/provider/prayer-reports" },
  { id: "team_chat_intro", icon: "\ud83d\udcac", title: "Team Chat", titleZh: "\u56e2\u961f\u804a\u5929", desc: "Connect with other volunteers! Share prayer requests, coordinate logistics, and encourage each other.", descZh: "\u4e0e\u5176\u4ed6\u5fd7\u613f\u8005\u8054\u7cfb\uff01\u5206\u4eab\u4ee3\u7977\u8bf7\u6c42\uff0c\u534f\u8c03\u5de5\u4f5c\uff0c\u5f7c\u6b64\u9f13\u52b1\u3002", action: "/provider/team-chat" },
  { id: "goals_intro", icon: "\ud83c\udfaf", title: "Weekly Goals", titleZh: "\u6bcf\u5468\u76ee\u6807", desc: "Set personal ministry goals each week. Track your visits, reports, and seniors served. Celebrate progress!", descZh: "\u6bcf\u5468\u8bbe\u5b9a\u4e2a\u4eba\u4e8b\u5de5\u76ee\u6807\u3002\u8ffd\u8e2a\u63a2\u8bbf\u3001\u62a5\u544a\u548c\u670d\u52a1\u957f\u8005\u6570\u3002", action: "/provider/goals" },
  { id: "complete", icon: "\ud83c\udf89", title: "You're Ready!", titleZh: "\u51c6\u5907\u5c31\u7eea\uff01", desc: "You've completed the tutorial. Go serve with love, and remember: God sees every act of kindness.", descZh: "\u60a8\u5df2\u5b8c\u6210\u6559\u7a0b\u3002\u53bb\u7528\u7231\u670d\u52a1\u5427\uff0c\u8bb0\u4f4f\uff1a\u4e0a\u5e1d\u770b\u89c1\u6bcf\u4e00\u4e2a\u5584\u884c\u3002" },
];

function TutorialContent() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isZh = locale.startsWith("zh");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/provider/tutorial").then(r => r.json()).then(d => {
      if (d.success) {
        const done = new Set<string>(d.steps.filter((s: { completed: boolean }) => s.completed).map((s: { id: string }) => s.id));
        setCompletedSteps(done);
        const firstIncomplete = STEPS.findIndex(s => !done.has(s.id));
        if (firstIncomplete >= 0) setCurrentStep(firstIncomplete);
        else setCurrentStep(STEPS.length - 1);
      }
    }).finally(() => setLoading(false));
  }, []);

  const markComplete = async (stepId: string) => {
    await fetch("/api/provider/tutorial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stepId }) });
    setCompletedSteps(prev => new Set([...prev, stepId]));
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  if (loading) return <div className="p-6 text-center text-xl">{isZh ? "\u52a0\u8f7d\u4e2d..." : "Loading..."}</div>;

  const step = STEPS[currentStep];
  const progress = (completedSteps.size / STEPS.length) * 100;

  return (
    <main className="max-w-lg mx-auto p-6 min-h-[100dvh] flex flex-col">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{currentStep + 1}/{STEPS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setCurrentStep(i)}
            className={"w-3 h-3 rounded-full transition-all " + (i === currentStep ? "bg-purple-600 scale-125" : completedSteps.has(s.id) ? "bg-green-400" : "bg-gray-300")} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="text-7xl mb-6">{step.icon}</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{isZh ? step.titleZh : step.title}</h2>
        <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-sm">{isZh ? step.descZh : step.desc}</p>

        {/* Action button (if step has a linked page) */}
        {"action" in step && step.action && !completedSteps.has(step.id) && (
          <button onClick={() => router.push("/" + locale + (step as { action: string }).action)}
            className="mb-4 px-8 py-4 bg-white border-2 border-purple-300 text-purple-700 rounded-2xl text-xl font-medium">
            {isZh ? "\u53bb\u770b\u770b \u2192" : "Try it \u2192"}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {currentStep > 0 && (
          <button onClick={() => setCurrentStep(currentStep - 1)}
            className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-xl font-medium">
            {isZh ? "\u4e0a\u4e00\u6b65" : "Back"}
          </button>
        )}
        <button onClick={() => markComplete(step.id)}
          className="flex-1 py-4 bg-purple-600 text-white rounded-2xl text-xl font-bold">
          {currentStep === STEPS.length - 1 ? (isZh ? "\u5b8c\u6210!" : "Finish!") : completedSteps.has(step.id) ? (isZh ? "\u4e0b\u4e00\u6b65" : "Next") : (isZh ? "\u6211\u77e5\u9053\u4e86" : "Got it")}
        </button>
      </div>

      {/* Skip */}
      {currentStep < STEPS.length - 1 && (
        <button onClick={() => { for (const s of STEPS) markComplete(s.id); setCurrentStep(STEPS.length - 1); }}
          className="mt-4 text-center text-base text-gray-400 underline">
          {isZh ? "\u8df3\u8fc7\u6559\u7a0b" : "Skip tutorial"}
        </button>
      )}
    </main>
  );
}

export default function TutorialPage() { return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><TutorialContent /></Suspense>; }
