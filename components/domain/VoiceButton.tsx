"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/cn";

type VoiceState = "idle" | "listening" | "processing";

const LANG_MAP: Record<string, string> = {
  en: "en-AU",
  zh: "zh-CN",
  zh_tw: "zh-TW",
  ja: "ja-JP",
  ko: "ko-KR",
  th: "th-TH",
};

/**
 * Voice input button using Web Speech API (browser-native).
 * Falls back gracefully on unsupported browsers.
 *
 * Architecture:
 * - Primary: Web Speech API (SpeechRecognition) — zero latency, no server cost
 * - Fallback: MediaRecorder → Whisper API (future, when API endpoint available)
 *
 * Supports: English, Mandarin, Cantonese, Japanese, Korean, Thai
 * Elder-first: large button, clear visual state, auto-stop after silence
 */
export function VoiceButton({ locale = "en" }: { locale?: string }) {
  const [state, setState] = useState<VoiceState>("idle");
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = LANG_MAP[locale] || "en-AU";

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results as SpeechRecognitionResultList);
      const text = results
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(text);

      // If final result, inject into the form input
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        injectIntoInput(text);
        setState("idle");
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("[VoiceButton] Speech recognition error:", event.error);
      setState("idle");
    };

    recognition.onend = () => {
      setState("idle");
    };

    recognitionRef.current = recognition;
  }, [locale]);

  const injectIntoInput = useCallback((text: string) => {
    // Find the message input in the form
    const input = document.querySelector<HTMLInputElement>(
      'input[name="message"]'
    );
    if (input) {
      // Use native input value setter to trigger React's onChange
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, text);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        input.value = text;
      }
      input.focus();
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (state === "listening") {
      recognitionRef.current.stop();
      setState("idle");
    } else {
      setTranscript("");
      try {
        recognitionRef.current.start();
        setState("listening");
      } catch (e) {
        // Already started — ignore
        console.warn("[VoiceButton] Could not start:", e);
      }
    }
  }, [state]);

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-12 w-12 items-center justify-center rounded-md text-text-tertiary opacity-40"
        title="Voice input not supported in this browser"
      >
        <MicOff size={22} aria-hidden />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        aria-label={state === "listening" ? "Stop listening" : "Start voice input"}
        className={cn(
          "inline-flex h-12 w-12 items-center justify-center rounded-full transition-all",
          state === "listening"
            ? "bg-danger text-white shadow-lg animate-pulse"
            : "text-text-primary hover:bg-bg-surface"
        )}
      >
        {state === "processing" ? (
          <Loader2 size={22} className="animate-spin" aria-hidden />
        ) : state === "listening" ? (
          <Mic size={22} aria-hidden />
        ) : (
          <Mic size={22} aria-hidden />
        )}
      </button>

      {/* Listening indicator */}
      {state === "listening" && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-danger px-2 py-1 text-[12px] font-medium text-white shadow">
          🎙 Listening…
        </div>
      )}

      {/* Interim transcript preview */}
      {state === "listening" && transcript && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 max-w-[200px] truncate rounded-md bg-bg-surface px-3 py-1 text-[13px] text-text-secondary shadow-sm">
          {transcript}
        </div>
      )}
    </div>
  );
}
