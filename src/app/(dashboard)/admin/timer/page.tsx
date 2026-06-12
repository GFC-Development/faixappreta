"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface RankedStudent {
  id: string;
  name: string;
  photoUrl: string | null;
  presences: number;
}

const ADD_OPTIONS = [
  { label: "+1", seconds: 60 },
  { label: "+3", seconds: 180 },
  { label: "+5", seconds: 300 },
];

function medalEmoji(position: number): string | null {
  switch (position) {
    case 1: return "\u{1F947}";
    case 2: return "\u{1F948}";
    case 3: return "\u{1F949}";
    default: return null;
  }
}

function badgeClass(position: number): string {
  switch (position) {
    case 1: return "bg-yellow-500 text-zinc-900";
    case 2: return "bg-gray-300 text-zinc-900";
    case 3: return "bg-amber-700 text-zinc-900";
    default: return "bg-white text-zinc-900";
  }
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioContext();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playBeeps(
  pattern: { freq: number; duration: number; gap: number }[]
): number {
  try {
    const ctx = getAudioContext();
    let t = ctx.currentTime + 0.05;
    for (const { freq, duration, gap } of pattern) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.value = 0.5;
      osc.start(t);
      osc.stop(t + duration);
      t += duration + gap;
    }
    return t - ctx.currentTime;
  } catch {
    return 0;
  }
}

const START_BEEPS = [
  { freq: 660, duration: 0.15, gap: 0.85 },
  { freq: 660, duration: 0.15, gap: 0.85 },
  { freq: 660, duration: 0.15, gap: 0.85 },
  { freq: 880, duration: 0.5, gap: 0 },
];

const FINISH_BEEPS = [{ freq: 880, duration: 1, gap: 0 }];

export default function TimerPage() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [countingDown, setCountingDown] = useState(false);
  const [finished, setFinished] = useState(false);
  const [blinkVisible, setBlinkVisible] = useState(true);
  const [ranking, setRanking] = useState<RankedStudent[]>([]);
  const [rankingMonth, setRankingMonth] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastConfigRef = useRef(0);

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

  // Fetch ranking
  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.json())
      .then((data) => {
        setRanking(Array.isArray(data?.ranked) ? data.ranked : Array.isArray(data) ? data : []);
        if (data?.monthLabel) setRankingMonth(data.monthLabel);
      });
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const startBlink = useCallback(() => {
    if (blinkRef.current) clearInterval(blinkRef.current);
    setBlinkVisible(true);
    blinkRef.current = setInterval(() => {
      setBlinkVisible((v) => !v);
    }, 500);
  }, []);

  const stopBlink = useCallback(() => {
    if (blinkRef.current) {
      clearInterval(blinkRef.current);
      blinkRef.current = null;
    }
    setBlinkVisible(true);
  }, []);

  const remainingRef = useRef(0);

  const tick = useCallback(() => {
    const prev = remainingRef.current;
    if (prev <= 1) {
      setRemaining(0);
      remainingRef.current = 0;
      stop();
      setFinished(true);
      startBlink();
      playBeeps(FINISH_BEEPS);
    } else {
      setRemaining(prev - 1);
      remainingRef.current = prev - 1;
    }
  }, [stop, startBlink]);

  function addTime(seconds: number) {
    setFinished(false);
    stopBlink();
    setRemaining((prev) => {
      const next = prev + seconds;
      lastConfigRef.current = next;
      remainingRef.current = next;
      return next;
    });
  }

  function startTimer() {
    setCountingDown(false);
    intervalRef.current = setInterval(tick, 1000);
    setRunning(true);
  }

  function playAndStart() {
    setCountingDown(true);
    const delay = playBeeps(START_BEEPS);
    setTimeout(startTimer, delay * 1000);
  }

  function togglePlay() {
    if (countingDown) return;
    if (running) {
      stop();
      return;
    }
    stopBlink();
    // If finished or at 0, restart with last configured time
    if (remaining === 0 && lastConfigRef.current > 0) {
      setRemaining(lastConfigRef.current);
      remainingRef.current = lastConfigRef.current;
      setFinished(false);
      playAndStart();
      return;
    }
    if (remaining === 0) return;
    setFinished(false);
    playAndStart();
  }

  function reset() {
    stop();
    stopBlink();
    setCountingDown(false);
    setRemaining(0);
    remainingRef.current = 0;
    setFinished(false);
    lastConfigRef.current = 0;
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (blinkRef.current) clearInterval(blinkRef.current);
    };
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Colors: green when idle/finished, red when running
  const hasTime = remaining > 0 || lastConfigRef.current > 0 || finished;
  const timerColor = running ? "text-red-500" : hasTime ? "text-emerald-500" : "text-zinc-700";
  const glowColor = running
    ? "0 0 40px rgba(239,68,68,0.5), 0 0 80px rgba(239,68,68,0.25)"
    : hasTime
    ? "0 0 40px rgba(16,185,129,0.5), 0 0 80px rgba(16,185,129,0.25)"
    : "none";

  const canPlay = !countingDown && (remaining > 0 || lastConfigRef.current > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Close button */}
      <button
        onClick={() => router.push("/admin")}
        className="absolute top-3 right-3 z-10 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Timer display */}
      <div
        className={`font-mono font-bold tracking-wider ${timerColor}`}
        style={{
          fontSize: "clamp(8rem, 28vw, 22rem)",
          lineHeight: 1,
          textShadow: glowColor,
          opacity: finished && !blinkVisible ? 0 : 1,
        }}
      >
        {display}
      </div>

      {/* Controls */}
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
          disabled={!canPlay}
          className={`flex items-center px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all ${
            !canPlay
              ? "bg-zinc-900 text-zinc-700 border-2 border-zinc-800 cursor-not-allowed"
              : running
              ? "bg-zinc-800 text-zinc-300 border-2 border-zinc-700 hover:bg-zinc-700"
              : "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 hover:bg-emerald-500/30"
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

      {/* Ranking — single row of boxes */}
      {ranking.length > 0 && (
        <div className="mt-6 sm:mt-10">
          {rankingMonth && (
            <h2 className="text-center text-lg sm:text-2xl font-bold text-zinc-50 uppercase tracking-wider mb-3 sm:mb-4">
              Ranking {rankingMonth}
            </h2>
          )}
        <div className="flex items-stretch gap-2 sm:gap-3 overflow-x-auto px-4 pb-2 max-w-full">
          {ranking.map((student, i) => {
            const pos = i + 1;
            const nameParts = student.name.split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
            const borderClass = pos === 1
              ? "border-yellow-500/60"
              : pos === 2
              ? "border-gray-400/60"
              : pos === 3
              ? "border-amber-700/60"
              : "border-zinc-800";
            return (
              <div
                key={student.id}
                className={`shrink-0 flex flex-col items-center justify-between rounded-lg border-2 bg-zinc-900/80 px-3 sm:px-4 py-2 sm:py-3 w-[72px] sm:w-[88px] ${borderClass}`}
              >
                {medalEmoji(pos) ? (
                  <span className="text-lg sm:text-xl leading-none">{medalEmoji(pos)}</span>
                ) : (
                  <div className={`text-xs sm:text-sm font-bold ${badgeClass(pos)} w-6 h-6 rounded-full flex items-center justify-center`}>
                    {pos}
                  </div>
                )}
                <div className="mt-1.5 text-center min-w-0 w-full">
                  <p className="text-[11px] sm:text-xs font-bold text-zinc-100 truncate">{firstName}</p>
                  {lastName && (
                    <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">{lastName}</p>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] sm:text-xs text-zinc-500 font-semibold">
                  {student.presences} <span className="hidden sm:inline">pres.</span>
                </p>
              </div>
            );
          })}
        </div>
        </div>
      )}
    </div>
  );
}
