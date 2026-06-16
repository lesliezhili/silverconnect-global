"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Voice-First Booking Button
 * 128px microphone button with pulsing red ring when listening
 * Web Speech API (browser-native, free)
 * TTS at 0.8x speed for elder comprehension
 */

type VoiceState = "idle" | "listening" | "processing" | "confirming" | "complete" | "error";

export default function VoiceBookingButton() {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const recognitionRef = useRef<any>(null);

  const processVoiceInput = async (text: string) => {
    try {
      const res = await fetch("/api/bookings/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await res.json();
      setResponse(data.confirmation || data.message);
      setState("confirming");

      // TTS response at 0.8x speed
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(data.confirmation);
        utterance.rate = 0.8;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setState("error");
      setResponse("Something went wrong. Please try again.");
    }
  };

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setState("error");
      setResponse("Voice not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang || "en-AU";

    recognition.onstart = () => setState("listening");
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };
    recognition.onend = () => {
      setState("processing");
      processVoiceInput(transcript);
    };
    recognition.onerror = () => {
      setState("error");
      setResponse("Could not hear you. Please try again.");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("listening");
  }, [transcript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Microphone Button - 128px */}
      <button
        onClick={state === "listening" ? stopListening : startListening}
        className={`relative flex items-center justify-center rounded-full transition-all ${
          state === "listening"
            ? "bg-red-600 voice-pulse shadow-2xl"
            : "bg-blue-600 shadow-lg hover:bg-blue-700"
        }`}
        style={{ width: "128px", height: "128px" }}
        aria-label={state === "listening" ? "Stop listening" : "Start voice booking"}
      >
        <span className="text-5xl text-white">
          {state === "listening" ? "⏹" : "🎤"}
        </span>
      </button>

      {/* Status Label */}
      <p className="text-elder-body font-medium text-gray-700">
        {state === "idle" && "Tap to speak your booking"}
        {state === "listening" && "Listening... speak now"}
        {state === "processing" && "Processing..."}
        {state === "confirming" && "Please confirm:"}
        {state === "complete" && "Booking confirmed! ✓"}
        {state === "error" && "Error occurred"}
      </p>

      {/* Live Transcript */}
      {transcript && (
        <div className="w-full max-w-sm rounded-2xl border-2 border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">You said:</p>
          <p className="mt-1 text-elder-body text-gray-900">{transcript}</p>
        </div>
      )}

      {/* AI Response */}
      {response && (
        <div className="w-full max-w-sm rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-600">AI:</p>
          <p className="mt-1 text-elder-body text-gray-900">{response}</p>
        </div>
      )}

      {/* Confirm/Cancel Buttons */}
      {state === "confirming" && (
        <div className="flex w-full max-w-sm gap-3">
          <button
            onClick={() => setState("complete")}
            className="flex-1 rounded-2xl bg-green-600 p-4 text-elder-body font-bold text-white"
            style={{ minHeight: "64px" }}
          >
            ✓ Confirm
          </button>
          <button
            onClick={() => { setState("idle"); setTranscript(""); setResponse(""); }}
            className="flex-1 rounded-2xl bg-gray-200 p-4 text-elder-body font-bold text-gray-700"
            style={{ minHeight: "64px" }}
          >
            ✕ Cancel
          </button>
        </div>
      )}
    </div>
  );
}
