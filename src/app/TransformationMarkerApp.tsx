/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/TransformationMarkerApp.tsx
'use client';

import React, { useState, useEffect } from 'react';

/***********************
 *  Data structures    *
 ************************/
interface Marker {
  id:    number;
  time:  number;                 // seconds
  track: 'Segment A' | 'Segment B';
  label: string;
  note:  string;
}

/**************** BPM Tapper ****************/
function BpmTapper() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm,  setBpm]  = useState<number | null>(null);

  const tap = () => {
    const now    = Date.now();
    const recent = taps.filter(t => now - t < 5_000).concat(now);
    setTaps(recent);

    if (recent.length >= 2) {
      const intervals = recent.slice(1).map((t, i) => t - recent[i]);
      const avg       = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.round(60_000 / avg));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={tap}
        className="bg-[#202124] text-[#10a37f] px-4 py-2 rounded border border-[#10a37f] hover:bg-[#565c6c]"
      >
        Tap BPM
      </button>

      <button
        onClick={() => { setTaps([]); setBpm(null); }}
        className="text-sm underline text-[#10a37f] hover:text-white"
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
  const [input,  setInput ] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const parse = (t: string) => {
    const [h, m, s] = t.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  const fmt = (sec: number) =>
    `${String(Math.floor(sec / 3600)).padStart(2, '0')}:` +
    `${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}:` +
    `${String(sec % 60).padStart(2, '0')}`;

  const calc = () => {
    const re =
      /video\s*start(?:s)?\s*time[:\s]*(\d{2}:\d{2}:\d{2})[\s\S]*?video\s*end\s*time[:\s]*(\d{2}:\d{2}:\d{2})[\s\S]*?audio\s*start(?:s)?\s*time[:\s]*(\d{2}:\d{2}:\d{2})[\s\S]*?audio\s*end\s*time[:\s]*(\d{2}:\d{2}:\d{2})/i;

    const m = input.match(re);
    if (!m) return setResult('Invalid input');
    const [, vs, ve, as, ae] = m;

    setResult(`Video: ${fmt(parse(ve) - parse(vs))}\nAudio: ${fmt(parse(ae) - parse(as))}`);
  };

  return (
    <div className="mt-16 border-t border-[#5a5f72] pt-6">
      <h3 className="text-xl font-semibold mb-4 text-[#d1d5db]">
        Duration Calculator
      </h3>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); calc(); } }}
        placeholder="Paste copied time segment input here"
        className="w-full bg-[#2f3136] px-4 py-2 rounded text-sm text-[#d1d5db] mb-2 resize-none"
        rows={1}
      />

      <div className="flex gap-4 mb-4">
        <button
          onClick={calc}
          className="bg-[#10a37f] text-[#202124] px-4 py-2 rounded hover:bg-[#42c78e]"
        >
          Calculate
        </button>

        <button
          onClick={() => { setInput(''); setResult(null); }}
          className="bg-[#202124] border border-[#10a37f] text-[#10a37f] px-4 py-2 rounded hover:bg-[#565c6c]"
        >
          Reset
        </button>
      </div>

      {result && (
        <pre className="text-sm whitespace-pre-wrap bg-[#2f3136] px-4 py-2 rounded border border-[#5a5f72] text-[#d1d5db]">
          {result}
        </pre>
      )}
    </div>
  );
}

/**************** Main App *******************/
export default function TransformationMarkerApp() {
  /* state */
  const [markers,   setMarkers]   = useState<Marker[]>([]);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX,    setHoverX]    = useState<number | null>(null);

  const TIMELINE = 600; // 10 minutes

  /* global styles (bg + scrollbar + animation) */
  useEffect(() => {
    const s = document.createElement('style');
    s.textContent =
      `@keyframes fade-in{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}` +
      `.hide-scrollbar::-webkit-scrollbar{width:0;height:0}` +
      `.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}` +
      `body{background:#202124}`;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  /* helpers */
  const fmt = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const ticks = Array.from({ length: TIMELINE + 1 }, (_, i) => i);

  /* marker actions */
  const addMarker = (
    e: React.MouseEvent<HTMLDivElement>,
    track: Marker['track']
  ) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - left, width));
    const sec = Math.round((pos / width) * TIMELINE);
    setMarkers(m => [...m, { id: Date.now(), time: sec, track, label: 'Select', note: '' }]);
  };

  const updateMarker = (id: number, key: keyof Marker, val: string) =>
    setMarkers(m => m.map(x => (x.id === id ? { ...x, [key]: val } : x)));

  const deleteMarker = (id: number) => setMarkers(m => m.filter(x => x.id !== id));
  const clearAll     = () => setMarkers([]);

  /* CSV export */
  const exportCSV = () => {
    const pad  = (n: number) => String(n).padStart(2, '0');
    const full = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

    const rows = [
      'Segment,Time,Label,Note',
      ...markers.map(m => `${m.track},${full(m.time)},${m.label},${m.note}`)
    ];

    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    const a   = document.createElement('a');
    a.href = url; a.download = 'markers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* UI */
  return (
    <div className="select-none p-6 max-w-6xl mx-auto text-[#d1d5db] min-h-screen overflow-x-hidden">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Transformation Marker Timeline</h2>
          <span className="text-xs">by VG</span>
        </div>

        <button
          onClick={exportCSV}
          className="bg-[#202124] text-[#10a37f] px-4 py-2 rounded border border-[#10a37f] hover:bg-[#565c6c]"
        >
          Export CSV
        </button>
      </div>

      {/* Timelines */}
      {(['Segment A', 'Segment B'] as const).map(track => (
        <div key={track} className="flex items-center gap-3 mb-10">
          <span className="text-2xl font-semibold text-[#10a37f] w-4 text-center">
            {track === 'Segment A' ? 'A' : 'B'}
          </span>

          <div className="relative flex-1">
            <div
              className="w-full h-8 bg-[#2f3136] rounded-2xl shadow-inner cursor-pointer"
              onClick={e => addMarker(e, track)}
              onMouseMove={e => {
                const { left, width } = e.currentTarget.getBoundingClientRect();
                setHoverX(e.clientX - left);
                setHoverTime(Math.round(((e.clientX - left) / width) * TIMELINE));
              }}
              onMouseLeave={() => setHoverTime(null)}
            >
              {/* ticks */}
              {ticks.filter(t => t % 10 === 0).map(t => (
                <div
                  key={t}
                  className={`absolute top-0 ${t % 60 === 0 ? 'h-full bg-[#10a37f]' : 'h-4 bg-[#5a5f72]'} w-px`}
                  style={{ left: `${(t / TIMELINE) * 100}%` }}
                />
              ))}

              {/* minute labels */}
              {ticks.filter(t => t % 60 === 0).map(t => (
                <div
                  key={`lbl${t}`}
                  className="absolute text-xs text-[#10a37f] mt-1"
                  style={{ left: `${(t / TIMELINE) * 100}%`, transform: 'translateX(-50%)', top: '2.25rem' }}
                >
                  {t / 60}
                </div>
              ))}

              {/* markers */}
              {markers.filter(m => m.track === track).map(m => (
                <div
                  key={m.id}
                  className="absolute top-0 h-8 w-[2px] bg-[#FF6B6B] animate-fade-in"
                  style={{ left: `${(m.time / TIMELINE) * 100}%` }}
                />
              ))}

              {/* hover tooltip */}
              {hoverTime !== null && hoverX !== null && (
                <div
                  className="absolute text-sm px-2 py-[2px] bg-[#202124] text-[#d1d5db] rounded shadow"
                  style={{ left: `${hoverX}px`, transform: 'translateX(-50%)', top: '-1.25rem' }}
                >
                  {fmt(hoverTime)}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Global controls */}
      <div className="mb-10 flex items-center gap-6">
        <button
          onClick={clearAll}
          className="bg-[#202124] text-[#10a37f] border border-[#10a37f] px-4 py-2 rounded hover:bg-[#565c6c]"
        >
          Clear All Markers
        </button>
        <BpmTapper />
      </div>

      {/* Marker tables */}
      <div className="grid grid-cols-2 gap-8 mb-16">
        {(['Segment A', 'Segment B'] as const).map(col => (
          <div key={col}>
            <h3 className="text-lg font-medium mb-2">{col} Markers</h3>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 hide-scrollbar">
              {markers
                .filter(m => m.track === col)
                .sort((a, b) => a.time - b.time)
                .map(m => (
                  <div key={m.id} className="flex flex-col gap-2 p-3 bg-[#2f3136] rounded-lg shadow-sm animate-fade-in">
                    <div className="flex items-center gap-4">
                      <span className="w-16 font-mono text-sm">{fmt(m.time)}</span>

                      <select
                        value={m.label}
                        onChange={e => updateMarker(m.id, 'label', e.target.value)}
                        className="appearance-none bg-[#2f3136] text-[#d1d5db] text-sm rounded-md px-3 py-2 border border-[#5a5f72] hover:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f] focus:outline-none"
                      >
                        <option>Select transformation</option>
                        {`Different Intro,New Drum Pattern,Different Instrument,Effects Added,Sample-Based Edit,Harmonic Variation,Voice Replaced by Instrument,Looped or Extended,Voiceover,Other,Different Ending/Outro,Same song - Different part`
                          .split(',')
                          .map(opt => <option key={opt}>{opt}</option>)}
                      </select>

                      <button
                        onClick={() => deleteMarker(m.id)}
                        className="bg-[#FF6B6B] text-white px-2 py-1 rounded hover:bg-[#D24C4C]"
                      >
                        Delete
                      </button>
                    </div>

                    <input
                      value={m.note}
                      onChange={e => updateMarker(m.id, 'note', e.target.value)}
                      placeholder="Add note…"
                      className="text-sm bg-[#202124] border border-[#5a5f72] rounded px-3 py-1 text-[#d1d5db] placeholder:text-[#5a5f72]"
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Duration calculator */}
      <DurationCalculator />
    </div>
  );
}
