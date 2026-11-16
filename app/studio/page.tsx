"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// Scores are randomly generated or restored from browser storage. Prerendering
// them on the server produces different notes during hydration.
const Orchestra = dynamic(() => import("../../components/Orchestra"), {
  ssr: false,
  loading: StudioLoading,
});

function StudioLoading() {
  return (
    <div className="studio-loading-screen" role="status">
      <div className="wordmark">
        <span className="brand-icon">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="brand-text">SYMPHONE</span>
      </div>
      <p>Preparing the Concert Hall…</p>
    </div>
  );
}

function StudioContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "full" ? "full" : "build";

  return <Orchestra key={mode} initialMode={mode} />;
}

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioLoading />}>
      <StudioContent />
    </Suspense>
  );
}
