"use client";

import React, { useEffect, useState } from "react";

const GlobalLoader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide loader once the client-side component has mounted (hydration complete)
    setIsLoading(false);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-transparent backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center gap-6">
        <span className="loader-ball scale-125"></span>
        <p className="text-sm font-bold tracking-widest uppercase animate-pulse text-(--loader-text) drop-shadow-sm">
          Please wait...
        </p>
      </div>
    </div>
  );
};

export default GlobalLoader;
