"use client";

import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  price: number;
}

interface BookingActionsProps {
  isUserLoggedIn: boolean;
  selectedService: Service | null;
  selectedDate: string | null;
  selectedTime: string | null;
  isBooking: boolean;
  onBookAppointment: () => void;
}

export function BookingActions({
  isUserLoggedIn,
  selectedService,
  selectedDate,
  selectedTime,
  isBooking,
  onBookAppointment,
}: BookingActionsProps) {
  // Check if all requirements are met
  const canShowBookingButton = () => {
    if (!selectedService?.id || !selectedDate || !selectedTime) {
      return false;
    }
    if (!selectedService.price || selectedService.price <= 0) {
      return false;
    }
    return true;
  };

  if (canShowBookingButton()) {
    return (
      <div className="mt-8">
        {!isUserLoggedIn && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 font-medium">
                  Please sign in to book an appointment
                </p>
                <div className="mt-2 flex gap-2">
                  <Link
                    href="/sign-in"
                    className="inline-block bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-1 px-3 rounded-md text-xs transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="inline-block text-amber-800 hover:underline text-xs"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          className="w-full py-6 text-lg bg-rose-600 hover:bg-rose-700 transition-colors"
          disabled={!isUserLoggedIn || isBooking}
          onClick={onBookAppointment}
        >
          {isBooking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
            </>
          ) : (
            <>
              Proceed to Payment - EGP{" "}
              {selectedService?.price?.toFixed(2) || "0.00"}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-gray-500 mt-3">
          By booking, you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/policy" className="underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-rose-400 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-rose-700">
            Please complete all selections
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <SelectionIndicator
              label="Service"
              isSelected={!!selectedService?.id}
            />
            <SelectionIndicator label="Date" isSelected={!!selectedDate} />
            <SelectionIndicator label="Time" isSelected={!!selectedTime} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectionIndicator({
  label,
  isSelected,
}: {
  label: string;
  isSelected: boolean;
}) {
  return (
    <div
      className={`px-3 py-1 rounded-md text-xs flex items-center ${
        isSelected ? "bg-green-50 text-green-600" : "bg-rose-100 text-rose-700"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full mr-1.5 ${
          isSelected ? "bg-green-500" : "bg-rose-500"
        }`}
      ></span>
      {label}
    </div>
  );
}
