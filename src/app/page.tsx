// src/app/page.tsx

'use client';

import Image from 'next/image';
import TransformationMarkerApp from './TransformationMarkerApp';

export default function Page() {
  return (
    <main className="p-6 max-w-6xl mx-auto text-[#F4F5FC] min-h-screen">
      {/* Header with the new white SVG logo + title */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Image
            src="/TMTLogo_White.svg"
            alt="TMT Logo"
            width={40}
            height={40}
            priority
          />
          <div>
            <h1 className="text-2xl font-semibold">
              Transformation Marker Timeline
            </h1>
            <span className="text-xs text-[#8EBBFF]">by Vasile Gutu</span>
          </div>
        </div>
      </div>

      {/* Mount your full interactive app */}
      <TransformationMarkerApp />
    </main>
  );
}
