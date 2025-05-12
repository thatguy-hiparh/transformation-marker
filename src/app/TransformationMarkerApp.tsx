/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/TransformationMarkerApp.tsx

'use client';

import React, { useState, useEffect } from 'react';

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
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const parse = (t: string): number => {
    const [h, m, s] = t.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  const fmt = (sec: number): string =>
    `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(
      Math.floor((sec % 3600) / 60)
    ).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const calc = (): void => {
    const re = /video\s*start(?:s)?\s*time[:\s]*(\d{2}:\d{2}:\d{2}).*?video\s*end\s*time[:\s]*(\d{2}:\d{2}:\d{2}).*?audio\s*start(?:s)?\s*time[:\s]*(\d{2}:\d{2}:\d{2}).*?audio\s*end\s*time[:\s]*(\d{2}:\d{2}:\d{2})/i;
    const m = input.match(re);
    if (!m) return setResult('Invalid input');
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
          onClick={() => {
            setInput('');
            setResult(null);
          }}
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

/**************** Main App *******************/
export default function TransformationMarkerApp() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const timelineLength = 600;

  useEffect(() => {
    const st = document.createElement('style');
    st.textContent = `@keyframes fade-in { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }\n.hide-scrollbar::-webkit-scrollbar { width: 0; height: 0; }\n.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }\nbody { background: #1E1E2F; }\n.animate-fade-in { animation: fade-in .3s ease-out; }`;
    document.head.appendChild(st);
    return () => {
      document.head.removeChild(st);
    };
  }, []);

  const format = (s: number): string =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const ticks = [...Array(601).keys()];

  const add = (e: React.MouseEvent<HTMLDivElement>, track: string): void => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - left, width));
    const sec = Math.round((pos / width) * timelineLength);
    setMarkers((m) => [...m, { id: Date.now(), time: sec, track, label: 'Select', note: '' }]);
  };

  const updateMarker = (id: number, key: keyof Marker, val: string): void =>
    setMarkers((m) => m.map((x) => (x.id === id ? { ...x, [key]: val } : x)));

  const deleteMarker = (id: number): void => setMarkers((m) => m.filter((x) => x.id !== id));
  const clearAll = (): void => setMarkers([]);

  const exportCSV = (): void => {
    const pad = (n: number): string => String(n).padStart(2, '0');
    const formatFull = (s: number): string =>
      `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    const rows = [
      'Segment,Time,Label,Note',
      ...markers.map((m) => `${m.track},${formatFull(m.time)},${m.label},${m.note}`),
    ];
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Transformation Marker Timeline</h2>
          <span className="text-xs text-[#8EBBFF]">by Vasende Gutu</span>
        </div>
        <button
          onClick={exportCSV}
          className="bg-[#2A2D40] text-[#8EBBFF] px-4 py-2 rounded border border-[#8EBB
