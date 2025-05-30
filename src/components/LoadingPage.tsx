import React from "react";
import { Loader2 } from "lucide-react";

const LoadingPage: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[50]">
      {/* Simple loading content */}
      <div className="flex flex-col items-center gap-4">
        {/* Simple spinner */}
        <div className="relative">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>

        {/* Loading text */}
        <p className="text-gray-600 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingPage;
