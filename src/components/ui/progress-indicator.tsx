import React from "react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressIndicator({
  progress,
  className,
  showPercentage = true,
}: ProgressIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-rose-500 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-gray-600 mt-1 text-right font-medium">
          {progress}%
        </div>
      )}
    </div>
  );
}
