"use client";

import { AlertCircle } from "lucide-react";

interface BookingStepsProps {
  step: number;
  title: string;
  children: React.ReactNode;
  isActive?: boolean;
  showAlert?: boolean;
  alertMessage?: string;
}

export function BookingStep({
  step,
  title,
  children,
  isActive = false,
  showAlert = false,
  alertMessage,
}: BookingStepsProps) {
  return (
    <div className={`my-6 ${isActive ? "opacity-100" : "opacity-75"}`}>
      <div className="flex items-center mb-4">
        <div
          className={`text-white font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
            isActive ? "bg-rose-500" : "bg-gray-400"
          }`}
        >
          {step}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      {showAlert && alertMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
            <p className="text-sm text-amber-700">{alertMessage}</p>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
