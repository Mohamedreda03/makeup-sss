"use client";

interface NotAvailableProps {
  message?: string;
}

export function NotAvailable({ message }: NotAvailableProps) {
  return (
    <div className="px-4 py-8">
      <div className="max-w-md mx-auto text-center bg-amber-50 p-6 rounded-lg border border-amber-200">
        <h2 className="text-2xl font-bold text-amber-800 mb-4">
          Not Accepting Bookings
        </h2>
        <p className="text-amber-700 mb-4">
          {message || "This artist is not currently accepting bookings."}
        </p>
        <p className="text-sm text-amber-600">
          Please check back later or contact the artist for more information.
        </p>
      </div>
    </div>
  );
}
