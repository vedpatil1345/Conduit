import React from "react";

const LazyLoader = () => {
  return (
    <div className="flex items-center justify-center p-8 transition-all duration-300">
      <div className="flex flex-col items-center gap-4">
        <span className="loader-sand"></span>
        <p className="text-xs font-medium animate-pulse text-muted-foreground/60">
          Loading component...
        </p>
      </div>
    </div>
  );
};

export default LazyLoader;
