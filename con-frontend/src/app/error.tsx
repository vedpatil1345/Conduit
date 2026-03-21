'use client'; // Error components must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { MoveLeft, RotateCw, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex grow max-h-dvh mt-16 items-center justify-center bg-background px-4 sm:px-6 lg:px-8 w-full relative select-none">
      <div className="text-center space-y-8">
        <div className="relative group flex justify-center">
          <h1 className="text-6xl xl:text-9xl scale-150 font-extrabold tracking-tighter text-foreground/20 drop-shadow-sm transition-transform duration-700 ease-in-out group-hover:scale-125">
            500
          </h1>
        </div>

        {/* Messaging & Actions Area */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl xl:text-4xl font-bold tracking-tight text-foreground flex items-center justify-center gap-3">
              <AlertTriangle className="text-destructive w-8 h-8" />
              Something went wrong!
            </h2>
            <p className="text-muted-foreground text-md xl:text-xl max-w-2xl mx-auto">
              We encountered an unexpected error. It might be a temporary issue, so you can try again or return to the dashboard.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <button 
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 h-8 xl:h-12 px-4 xl:px-8 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <RotateCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full border-2 border-primary/10 bg-background/50 text-foreground font-medium hover:bg-accent hover:text-accent-foreground hover:border-primary/30 transition-all shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <MoveLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
