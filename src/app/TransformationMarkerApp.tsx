/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/TransformationMarkerApp.tsx

'use client';

import React, { useState, useEffect } from "react";

interface Marker {
  id: number;
  time: number;
  track: string;
  label: string;
  note: string;
}

/**************** BPM Tapper ****************/
function BpmTapper() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);

  const tap = () => {
    const now = Date.now();
    const recent = taps.filter((t) => now - t < 5000).concat(now);
    setTaps(recent);
    if (recent.length >= 2) {
      const intervals = recent.slice(1).map((t, i) => t - recent[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.round(60000 / avg));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={tap}
        className="bg-[#2A2D40] text-[#8EBBFF] px-4 py-2 rounded border border-[#8EBBFF] hover:bg-[#374160]"
      >
        Tap BPM
      </button>
      <button
        onClick={() => {
          setTaps([]);
          setBpm(null);
        }}
        className="text-sm underline text-[#8EBBFF] hover:text-white"
      >
        Reset
      </button>
      {bpm !== null && (
        <span className="text-2xl text-[#FF6B6B] font-semibold">BPM: {bpm}</span>
      )}
    </div>
  );
}

/************* Duration Calculator ***********/
function DurationCalculator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const parse = (t: string): number => {
    const [h, m, s] = t.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const fmt = (sec: number): string => {
    const hours = String(Math.floor(sec / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const seconds = String(sec % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const calc = (): void => {
    const re = /video\s*start(?:s)?\s*time[:\s]*(\d{2}:\d{2}:\d{2}).*?video\s*end\s*time[:\s]*(\d{2}:\d{2}:\d{2}).*?audio\s*start(?:s)?\s*time[:\s]*(\d{2}:\d{2}:\d{2}).*?audio\s*end\s*time[:\s]*(\d{2}:\d{2}:\d{2})/i;
    const m = input.match(re);
    if (!m) return setResult("Invalid input");
    const [, vs, ve, as, ae] = m;
    setResult(
      `Video: ${fmt(parse(ve) - parse(vs))}\nAudio: ${fmt(parse(ae) - parse(as))}`
    );
  };

  return (
    <div className="mt-16 border-t border-[#4A4D60] pt-6">
      <h3 className="text-xl font-semibold mb-4">Duration Calculator</h3>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            calc();
          }
        }}
        placeholder="Paste copied time segment input here"
        className="w-full bg-[#2A2D40] px-4 py-2 rounded text-sm text-white mb-2"
        rows={1}
      />
      <div className="flex gap-4 mb-4">
        <button
          onClick={calc}
          className="bg-[#8EBBFF] text-[#1E1E2F] px-4 py-2 rounded hover:bg-[#A6CCFF]"
        >
          Calculate
        </button>
        <button
          onClick={() => { setInput(""); setResult(null); }}
          className="bg-[#2A2D40] border border-[#8EBBFF] text-[#8EBBFF] px-4 py-2 rounded hover:bg-[#374160]"
        >
          Reset
        </button>
      </div>
      {result && (
        <pre className="text-sm whitespace-pre-wrap bg-[#1E1E2F] px-4 py-2 rounded border border-[#4A4D60]">
          {result}
        </pre>
      )}
    </div>
  );
}

export default function TransformationMarkerApp() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const timelineLength = 600;

  useEffect(() => {
    const st = document.createElement('style');
    st.textContent = `@keyframes fade-in{from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }\n.hide-scrollbar::-webkit-scrollbar{width:0;height:0;}\n.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}\nbody{background:#1E1E2F;}\n.animate-fade-in{animation:fade-in .3s ease-out;} `;
    document.head.appendChild(st);
    return () => { document.head.removeChild(st); };
  }, []);

  const format = (s: number): string => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  const ticks = [...Array(601).keys()];

  // ... rest of component code unchanged ...
  return (
    <div className="p-6 max-w-6xl mx-auto text-[#F4F5FC] min-h-screen overflow-x-hidden">
      {/* full JSX from earlier with loops, etc. */}
    </div>
  );
}
