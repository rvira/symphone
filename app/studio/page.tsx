"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Orchestra from "../../components/Orchestra";

function StudioContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "full" ? "full" : "build";

  return <Orchestra key={mode} initialMode={mode} />;
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="studio-loading-screen">
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
      }
    >
      <StudioContent />
    </Suspense>
  );
}
