"use client";

import {
  formatTimeToEgypt12h,
  formatDateToEgyptLocale,
} from "@/lib/timezone-config";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  artistId: string;
  duration?: number;
}

interface BookingSummaryProps {
  selectedService: Service;
  selectedDate: string;
  selectedTime: string;
  artistName?: string;
}

export function BookingSummary({
  selectedService,
  selectedDate,
  selectedTime,
  artistName,
}: BookingSummaryProps) {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-center mb-4">
        <div className="bg-rose-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
          4
        </div>
        <h3 className="text-lg font-semibold">Confirm Your Booking</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-3">
            Appointment Details
          </h4>
          <div className="space-y-3 text-md">
            <div className="flex justify-between">
              <span className="text-gray-500">Service:</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>{" "}
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>{" "}
              <span className="font-medium">
                {" "}
                {(() => {
                  try {
                    return formatDateToEgyptLocale(selectedDate);
                  } catch {
                    return "Date not available";
                  }
                })()}
              </span>
            </div>{" "}
            <div className="flex justify-between">
              <span className="text-gray-500">Time:</span>
              <span className="font-medium">
                {(() => {
                  try {
                    return formatTimeToEgypt12h(selectedTime);
                  } catch {
                    return selectedTime;
                  }
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Artist:</span>
              <span className="font-medium">
                {artistName || "Professional Artist"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100">
          <span className="text-lg font-bold text-gray-800">Total Price:</span>
          <span className="text-xl font-bold text-green-600">
            EGP {selectedService.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
