// src/app/page.tsx
'use client';

-import React from 'react';
+import React from 'react';
+import Image from 'next/image';
+import TransformationMarkerApp from './TransformationMarkerApp';

-export default function Page() {
-  return (
-    <>  
-      {/* Your app lives in TransformationMarkerApp.tsx */}
-    </>
-  );
-}
+export default function Page() {
+  return (
+    <main className="p-6 max-w-6xl mx-auto text-[#F4F5FC] min-h-screen">
+      {/* ——— Header with logo, title & export button ——— */}
+      <div className="flex justify-between items-center mb-6">
+        <div className="flex items-center gap-3">
+          <Image
+            src="/TMTLogo_White.svg"
+            alt="TMT Logo"
+            width={40}
+            height={40}
+            priority
+          />
+          <div>
+            <h1 className="text-2xl font-semibold">
+              Transformation Marker Timeline
+            </h1>
+            <span className="text-xs text-[#8EBBFF]">by Vasile Gutu</span>
+          </div>
+        </div>
+        {/* If you want the CSV button up here instead of inside the marker app: */}
+        <button
+          onClick={() => console.warn('Hook up exportCSV via props')}
+          className="bg-[#2A2D40] text-[#8EBBFF] px-4 py-2 rounded border border-[#8EBBFF] hover:bg-[#374160]"
+        >
+          Export CSV
+        </button>
+      </div>
+
+      {/* ——— Your interactive app component ——— */}
+      <TransformationMarkerApp />
+    </main>
+  );
+}
