"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { RankingBoard } from "@/components/ranking-board";

const ADD_OPTIONS = [
  { label: "+1", seconds: 60 },
  { label: "+3", seconds: 180 },
  { label: "+5", seconds: 300 },
];

export default function TimerPage() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hide sidebar
  useEffect(() => {
    const sidebar = document.querySelector("aside") as HTMLElement | null;
    const topbar = document.querySelector("div.fixed.top-0") as HTMLElement | null;
    const main = document.querySelector("main") as HTMLElement | null;
    if (sidebar) sidebar.style.display = "none";
    if (topbar) topbar.style.display = "none";
    if (main) {
      main.style.padding = "0";
      main.style.paddingTop = "0";
    }
    return () => {
      if (sidebar) sidebar.style.display = "";
      if (topbar) topbar.style.display = "";
      if (main) {
        main.style.padding = "";
        main.style.paddingTop = "";
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        stop();
        setFinished(true);
        try {
          const ctx = new AudioContext();
          const totalBeeps = 10;
          for (let i = 0; i < totalBeeps; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "square";
            osc.frequency.value = i % 2 === 0 ? 880 : 660;
            gain.gain.value = 0.5;
            const start = ctx.currentTime + i * 0.3;
            osc.start(start);
            osc.stop(start + 0.2);
          }
        } catch {}
        return 0;
      }
      return prev - 1;
    });
  }, [stop]);

  function addTime(seconds: number) {
    setFinished(false);
    setRemaining((prev) => prev + seconds);
  }

  function togglePlay() {
    if (remaining === 0) return;
    if (running) {
      stop();
    } else {
      setFinished(false);
      intervalRef.current = setInterval(tick, 1000);
      setRunning(true);
    }
  }

  function reset() {
    stop();
    setRemaining(0);
    setFinished(false);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Close button */}
      <button
        onClick={() => router.push("/admin")}
        className="absolute top-3 right-3 z-10 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Timer — takes natural space, ranking scrolls below */}
      <div className="shrink-0 flex flex-col items-center justify-center py-4">
        <div
          className={`font-mono font-bold tracking-wider transition-colors ${
            finished ? "text-red-500 animate-pulse" : remaining === 0 ? "text-zinc-700" : "text-red-500"
          }`}
          style={{
            fontSize: "clamp(8rem, 28vw, 22rem)",
            lineHeight: 1,
            textShadow: remaining > 0 || finished
              ? "0 0 40px rgba(239,68,68,0.5), 0 0 80px rgba(239,68,68,0.25)"
              : "none",
          }}
        >
          {display}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
          {ADD_OPTIONS.map((opt) => (
            <button
              key={opt.seconds}
              onClick={() => addTime(opt.seconds)}
              className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-base sm:text-lg font-bold bg-zinc-900 text-zinc-400 border-2 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200 transition-all"
            >
              {opt.label}
            </button>
          ))}

          <div className="w-px h-6 sm:h-8 bg-zinc-800" />

          <button
            onClick={togglePlay}
            disabled={remaining === 0}
            className={`flex items-center px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all ${
              remaining === 0
                ? "bg-zinc-900 text-zinc-700 border-2 border-zinc-800 cursor-not-allowed"
                : running
                ? "bg-zinc-800 text-zinc-300 border-2 border-zinc-700 hover:bg-zinc-700"
                : "bg-red-500/20 text-red-400 border-2 border-red-500/40 hover:bg-red-500/30"
            }`}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={reset}
            className="flex items-center px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-zinc-900 text-zinc-400 border-2 border-zinc-800 hover:text-zinc-200 hover:border-zinc-600 transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Ranking — fills remaining space */}
      <div className="flex-1 min-h-0 px-4 pb-4 max-w-3xl mx-auto w-full overflow-y-auto">
        <RankingBoard compact />
      </div>
    </div>
  );
}
