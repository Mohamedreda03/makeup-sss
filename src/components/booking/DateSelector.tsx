"use client";

import { useRef, MouseEvent, TouchEvent } from "react";

interface DayAvailability {
  date: string;
  dayLabel: string;
  dayNumber: string;
  monthName: string;
  isDayOff?: boolean;
  timeSlots: any[];
}

interface DateSelectorProps {
  availability: DayAvailability[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  isDayOff: (date: string) => boolean;
}

export function DateSelector({
  availability,
  selectedDate,
  onDateSelect,
  isDayOff,
}: DateSelectorProps) {
  const daysContainerRef = useRef<HTMLDivElement>(null);

  // Mouse and touch event handlers for dragging
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!daysContainerRef.current) return;
    const startX = e.clientX;
    const scrollLeft = daysContainerRef.current.scrollLeft;

    const handleMouseMove = (e: MouseEvent) => {
      if (!daysContainerRef.current) return;
      e.preventDefault();
      const x = e.clientX;
      const walk = (startX - x) * 2;
      daysContainerRef.current.scrollLeft = scrollLeft + walk;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove as any);
      document.removeEventListener("mouseup", handleMouseUp);
      if (daysContainerRef.current) {
        daysContainerRef.current.style.cursor = "grab";
        daysContainerRef.current.style.removeProperty("user-select");
      }
    };

    if (daysContainerRef.current) {
      daysContainerRef.current.style.cursor = "grabbing";
      daysContainerRef.current.style.userSelect = "none";
    }

    document.addEventListener("mousemove", handleMouseMove as any);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!daysContainerRef.current || !e.touches[0]) return;
    const startX = e.touches[0].clientX;
    const scrollLeft = daysContainerRef.current.scrollLeft;

    const handleTouchMove = (e: TouchEvent) => {
      if (!daysContainerRef.current || !e.touches[0]) return;
      const x = e.touches[0].clientX;
      const walk = (startX - x) * 2;
      daysContainerRef.current.scrollLeft = scrollLeft + walk;
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove as any);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove as any);
    document.addEventListener("touchend", handleTouchEnd);
  };

  if (!availability || availability.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No availability found for this artist
      </div>
    );
  }

  return (
    <div className="overflow-hidden pb-6">
      <div
        ref={daysContainerRef}
        className="overflow-x-auto py-2 scrollbar-hide cursor-grab"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="flex space-x-4 min-w-max pl-4 pr-4">
          {availability
            .filter((day) => !isDayOff(day.date) && day.timeSlots.length > 0)
            .map((day) => {
              const hasAvailableSlots = day.timeSlots.length > 0;

              return (
                <button
                  key={day.date}
                  onClick={() => onDateSelect(day.date)}
                  disabled={!hasAvailableSlots}
                  className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-colors ${
                    selectedDate === day.date
                      ? "bg-rose-400 text-white"
                      : !hasAvailableSlots
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  style={{ minWidth: "90px" }}
                >
                  <span className="text-xs font-medium uppercase">
                    {day.dayLabel}
                  </span>
                  <span className="text-2xl font-bold">{day.dayNumber}</span>
                  {!hasAvailableSlots && (
                    <span className="text-xs mt-1 opacity-75">Full</span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
