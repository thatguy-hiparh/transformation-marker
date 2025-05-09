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
        <span className="text-xl text-[#FF6B6B] font-semibold">BPM: {bpm}</span>
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

  const fmt = (sec: number): string =>
    `${String(Math.floor(sec / 3600)).padStart(2, "0")}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

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
          onClick={() => {
            setInput("");
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
    st.textContent = `@keyframes fade-in{from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);}}
  .hide-scrollbar::-webkit-scrollbar{width:0;height:0;}
  .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
  body{background:#1E1E2F;}
  .animate-fade-in{animation:fade-in .3s ease-out;}`;
    document.head.appendChild(st);
    return () => {
      document.head.removeChild(st);
    };
  }, []);

  const format = (s: number): string =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:
${String(s % 60).padStart(2, '0')}`;
  const ticks = [...Array(601).keys()];

  const add = (e: React.MouseEvent<HTMLDivElement>, track: string): void => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - left, width));
    const sec = Math.round((pos / width) * timelineLength);
    setMarkers((m) => [...m, { id: Date.now(), time: sec, track, label: 'Select', note: '' }]);
  };

  const updateMarker = (id: number, key: keyof Marker, val: string): void =>
    setMarkers((m) =>
      m.map((x) =>
        x.id === id ? { ...x, [key]: val } : x
      )
    );
  const deleteMarker = (id: number): void =>
    setMarkers((m) => m.filter((x) => x.id !== id));
  const clearAll = (): void => setMarkers([]);

  const exportCSV = (): void => {
    const rows = ["Segment,Time,Label,Note", ...markers.map(m => `${m.track},${format(m.time)},${m.label},${m.note}`)];
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-[#F4F5FC] min-h-screen overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Transformation Marker Timeline</h2>
        <button onClick={exportCSV} className="text-sm underline text-[#8EBBFF] hover:text-white">Export CSV</button>
      </div>

      {['Segment A', 'Segment B'].map(track => {
        const label = track === 'Segment A' ? 'A' : 'B';
        return (
          <div key={track} className="flex items-center gap-3 mb-10">
            <span className="text-2xl font-semibold text-[#8EBBFF] w-4 text-center">{label}</span>
            <div className="relative flex-1">
              <div
                className="w-full h-8 bg-[#2A2D40] rounded-2xl shadow-inner cursor-pointer"
                onClick={(e) => add(e, track)}
                onMouseMove={(e) => {
                  const { left, width } = e.currentTarget.getBoundingClientRect();
                  setHoverX(e.clientX - left);
                  setHoverTime(Math.round((e.clientX - left) / width * timelineLength));
                }}
                onMouseLeave={() => setHoverTime(null)}
              >
                {ticks.filter(t => t % 10 === 0).map(t => (
                  <div key={t} className={`absolute top-0 ${t % 60 === 0 ? 'h-full bg-[#8EBBFF]' : 'h-4 bg-[#4A4D60]'} w-px`} style={{ left: `${t / 600 * 100}%` }} />
                ))}
                {ticks.filter(t => t % 60 === 0).map(t => (
                  <div key={'lbl' + t} className="absolute text-xs text-[#8EBBFF] mt-1" style={{ left: `${t / 600 * 100}%`, transform: 'translateX(-50%)', top: '2.25rem' }}>{t / 60}</div>
                ))}
                {markers.filter(m => m.track === track).map(m => (
                  <div key={m.id} className="absolute top-0 h-8 w-[2px] bg-[#FF6B6B] animate-fade-in" style={{ left: `${m.time / 600 * 100}%` }} />
                ))}
                {hoverTime !== null && hoverX !== null && (
                  <div className="absolute text-sm px-2 py-[2px] bg-black text-white rounded shadow" style={{ left: `${hoverX}px`, transform: 'translateX(-50%)', top: '-1.25rem' }}>
                    {format(hoverTime)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="mb-10 flex items-center gap-6">
        <button onClick={clearAll} className="bg-[#2A2D40] text-[#8EBBFF] border border-[#8EBBFF] px-4 py-2 rounded hover:bg-[#374160]">Clear All Markers</button>
        <BpmTapper />
      </div>

      <div className="grid grid-cols-2 gap-8 mb-16">
        {['Segment A', 'Segment B'].map(col => {
          const list = markers.filter(m => m.track === col).sort((a, b) => a.time - b.time);
          return (
            <div key={col}>
              <h3 className="text-lg font-medium mb-2">{col} Markers</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 hide-scrollbar">
                {list.map(m => (
                  <div key={m.id} className="flex flex-col gap-2 p-3 bg-[#2A2D40] rounded-lg shadow-sm animate-fade-in">
                    <div className="flex items-center gap-4">
                      <span className="w-16 font-mono text-sm">{format(m.time)}</span>
                      <select value={m.label} onChange={e => updateMarker(m.id, 'label', e.target.value)} className="appearance-none bg-[#2A2D40] text-[#F4F5FC] text-sm rounded-md px-3 py-2 border border-[#4A4D60] hover:border-[#8EBBFF] focus:ring-2 focus:ring-[#8EBBFF]">
                        <option>Select transformation</option>
                        {"Different Intro,New Drum Pattern,Different Instrument,Effects Added,Sample-Based Edit,Harmonic Variation,Voice Replaced by Instrument,Looped or Extended,Voiceover,Other,Different Ending/Outro,Same song - Different part".split(',').map(o => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                      <button onClick={() => deleteMarker(m.id)} className="bg-[#FF6B6B] text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
                    </div>
                    <input value={m.note} onChange={e => updateMarker(m.id, 'note', e.target.value)} placeholder="Add note..." className="text-sm bg-[#1E1E2F] border border-[#4A4D60] rounded px-3 py-1 text-[#F4F5FC] placeholder:text-[#8EBBFF]" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <DurationCalculator />
    </div>
  );
}
