"use client";

import { useRef, MouseEvent, TouchEvent } from "react";

interface TimeSlot {
  time: string;
  label: string;
  isBooked?: boolean;
}

interface TimeSelectorProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

export function TimeSelector({
  timeSlots,
  selectedTime,
  onTimeSelect,
}: TimeSelectorProps) {
  const timeSlotContainerRef = useRef<HTMLDivElement>(null);

  // Mouse and touch event handlers for dragging
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!timeSlotContainerRef.current) return;
    const startX = e.clientX;
    const scrollLeft = timeSlotContainerRef.current.scrollLeft;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!timeSlotContainerRef.current) return;
      e.preventDefault();
      const x = e.clientX;
      const walk = (startX - x) * 2;
      timeSlotContainerRef.current.scrollLeft = scrollLeft + walk;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (timeSlotContainerRef.current) {
        timeSlotContainerRef.current.style.cursor = "grab";
        timeSlotContainerRef.current.style.removeProperty("user-select");
      }
    };

    if (timeSlotContainerRef.current) {
      timeSlotContainerRef.current.style.cursor = "grabbing";
      timeSlotContainerRef.current.style.userSelect = "none";
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!timeSlotContainerRef.current || !e.touches[0]) return;
    const startX = e.touches[0].clientX;
    const scrollLeft = timeSlotContainerRef.current.scrollLeft;

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (!timeSlotContainerRef.current || !e.touches[0]) return;
      const x = e.touches[0].clientX;
      const walk = (startX - x) * 2;
      timeSlotContainerRef.current.scrollLeft = scrollLeft + walk;
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-lg font-medium">No available time slots</div>
        <div className="text-sm mt-1">
          Please select a different date or check back later
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden relative">
      <div className="mb-4 text-sm text-gray-600 px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-rose-600">
            {timeSlots.filter((slot) => !slot.isBooked).length} available
          </span>
          {timeSlots.filter((slot) => slot.isBooked).length > 0 && (
            <span className="font-medium text-gray-500">
              • {timeSlots.filter((slot) => slot.isBooked).length} booked
            </span>
          )}
          <span className="text-gray-400">
            • {timeSlots.length} total slots
          </span>
        </div>
      </div>
      <div
        ref={timeSlotContainerRef}
        className="overflow-x-auto py-6 scrollbar-hide cursor-grab"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          paddingLeft: "16px",
          paddingRight: "16px",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="flex space-x-4 min-w-max">
          {timeSlots.map((slot) => {
            const isBooked = slot.isBooked === true;
            const isSelected = selectedTime === slot.label && !isBooked;

            return (
              <button
                key={`${slot.time}-${slot.label}`}
                onClick={() => {
                  if (!isBooked) {
                    onTimeSelect(slot.label);
                  }
                }}
                disabled={isBooked}
                className={`group py-3 px-4 rounded-full border transition-all duration-200 ${
                  isSelected
                    ? "bg-rose-500 text-white border-rose-500 shadow-md transform scale-105"
                    : isBooked
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70"
                    : "bg-white hover:bg-rose-50 text-gray-800 border-gray-300 hover:border-rose-400 hover:shadow-md"
                }`}
                style={{
                  minWidth: "110px",
                  boxShadow: isSelected
                    ? "0 4px 12px rgba(244, 63, 94, 0.3)"
                    : isBooked
                    ? "none"
                    : "0 1px 2px rgba(0,0,0,0.05)",
                }}
                title={
                  isBooked
                    ? "This time slot is already booked"
                    : `Select ${slot.label} appointment`
                }
              >
                <div className="text-center">
                  <div className="font-medium">{slot.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
