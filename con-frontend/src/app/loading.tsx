import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center gap-4">
        <span className="loader-ball"></span>
        <p className="text-sm font-medium animate-pulse text-muted-foreground">
          Loading page...
        </p>
      </div>
    </div>
  );
}
