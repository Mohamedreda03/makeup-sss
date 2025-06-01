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

  // Debug logging for timezone issues
  console.log("TimeSelector - Debug Info:", {
    totalSlots: timeSlots.length,
    availableSlots: timeSlots.filter((slot) => !slot.isBooked).length,
    bookedSlots: timeSlots.filter((slot) => slot.isBooked).length,
    selectedTime,
    currentTime: new Date().toLocaleString(),
    currentTimeEgypt: new Date().toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
    }),
    timeSlots: timeSlots.map((slot) => ({
      time: slot.time,
      label: slot.label,
      isBooked: slot.isBooked,
    })),
  });

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
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
        No available time slots for this day
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden relative">
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
        {" "}
        <div className="flex space-x-4 min-w-max">
          {" "}
          {timeSlots.map((slot) => {
            const isBooked = slot.isBooked === true;
            const isSelected = selectedTime === slot.label && !isBooked;

            return (
              <button
                key={slot.time}
                onClick={() => !isBooked && onTimeSelect(slot.label)}
                disabled={isBooked}
                className={`py-3 px-4 rounded-full border transition-colors ${
                  isSelected
                    ? "bg-rose-500 text-white border-rose-500"
                    : isBooked
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  minWidth: "110px",
                  boxShadow: isSelected
                    ? "none"
                    : isBooked
                    ? "none"
                    : "0 1px 2px rgba(0,0,0,0.05)",
                }}
                title={isBooked ? "This time slot is already booked" : ""}
              >
                <div className="text-center font-medium">{slot.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom scrollbar styling */}
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
