"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  CreditCard,
  Calendar,
  Clock,
  User,
  DollarSign,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Lock,
} from "lucide-react";

// Define appointment type
interface Appointment {
  id: string;
  datetime: string;
  serviceType: string;
  status: string;
  totalPrice: number;
  artistName?: string | null;
  isPaid?: boolean;
}

export default function PaymentPage() {
  const router = useRouter();
  const { appointmentId } = useParams();
  const { data: session } = useSession();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  });
  const [errors, setErrors] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  });

  // Fetch appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch(`/api/appointments/${appointmentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch appointment");
        }

        const data = await response.json();
        setAppointment(data);
      } catch (error) {
        console.error("Error fetching appointment:", error);
        toast({
          title: "Error",
          description: "Could not load appointment details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, session]);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }

    return v;
  };

  // Validate card number
  const validateCardNumber = (cardNumber: string) => {
    const cardNumberRegex = /^(\d{4}\s){3}\d{4}$|^(\d{4}\s){3}\d{1,4}$/;
    return cardNumberRegex.test(cardNumber);
  };

  // Validate expiry date
  const validateExpiryDate = (expiryDate: string) => {
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiryDate)) return false;

    const [month, year] = expiryDate.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expYear = parseInt(year, 10);
    const expMonth = parseInt(month, 10);

    if (
      expYear < currentYear ||
      (expYear === currentYear && expMonth < currentMonth)
    ) {
      return false;
    }

    return true;
  };

  // Validate CVV
  const validateCVV = (cvv: string) => {
    const cvvRegex = /^[0-9]{3,4}$/;
    return cvvRegex.test(cvv);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format based on field
    if (name === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (name === "expiryDate") {
      formattedValue = formatExpiryDate(value);
    } else if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").substring(0, 4);
    }

    setPaymentDetails((prev) => ({ ...prev, [name]: formattedValue }));

    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Process payment
  const handlePayment = async () => {
    if (!appointment) return;

    // Validate all fields
    const newErrors = {
      cardNumber: !paymentDetails.cardNumber
        ? "Card number is required"
        : !validateCardNumber(paymentDetails.cardNumber)
        ? "Invalid card number"
        : "",
      cardholderName: !paymentDetails.cardholderName
        ? "Cardholder name is required"
        : paymentDetails.cardholderName.length < 3
        ? "Name is too short"
        : "",
      expiryDate: !paymentDetails.expiryDate
        ? "Expiry date is required"
        : !validateExpiryDate(paymentDetails.expiryDate)
        ? "Invalid or expired date"
        : "",
      cvv: !paymentDetails.cvv
        ? "CVV is required"
        : !validateCVV(paymentDetails.cvv)
        ? "Invalid CVV"
        : "",
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    setIsProcessing(true);

    try {
      // In a real app, you'd process payment through a payment gateway
      // For demo purposes, we'll just mark it as paid
      const response = await fetch(
        `/api/appointments/${appointmentId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // In a real app, you'd send tokenized payment info
            // Do NOT send raw credit card details to your backend
            // This is just for demonstration
            isPaid: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Payment processing failed");
      }

      toast({
        title: "Payment Successful",
        description: "Your appointment has been paid for",
        variant: "success",
      });

      // Redirect back to appointments page
      setTimeout(() => {
        router.push("/appointments");
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-semibold text-red-600">
                Appointment Not Found
              </h2>
              <p className="mt-2 mb-6 text-gray-500 max-w-md mx-auto">
                The appointment you're trying to pay for doesn't exist or may
                have been cancelled.
              </p>
              <Button
                onClick={() => router.push("/appointments")}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Back to Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If appointment is already paid
  if (appointment.isPaid) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <Card className="border-green-100 overflow-hidden">
          <CardHeader className="bg-green-50 border-b border-green-100">
            <CardTitle className="text-green-700 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Payment Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-semibold text-green-700 mb-2">
                Payment Successful
              </h2>
              <p className="mt-2 mb-4 text-gray-600 max-w-md mx-auto">
                This appointment has been paid for. The artist has been notified
                and will receive your payment.
              </p>
              <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-medium text-green-800 mb-2">
                  Transaction Details:
                </h3>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">
                      ${appointment.totalPrice.toFixed(2)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Artist:</span>
                    <span className="font-semibold">
                      {appointment.artistName}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold">Completed</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => router.push("/appointments")}
                className="bg-green-600 hover:bg-green-700"
              >
                View My Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Secure Payment</h1>

      {/* Appointment Summary */}
      <Card className="mb-8 border-rose-100 overflow-hidden">
        <CardHeader className="bg-rose-50 border-b border-rose-100">
          <CardTitle className="text-rose-700">Appointment Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium flex items-center text-gray-700">
                <Calendar className="mr-2 h-4 w-4 text-rose-500" />
                Date & Time
              </span>
              <span className="text-gray-900">
                {format(new Date(appointment.datetime), "MMMM d, yyyy")} at{" "}
                {format(new Date(appointment.datetime), "h:mm a")}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium flex items-center text-gray-700">
                <User className="mr-2 h-4 w-4 text-rose-500" />
                Service
              </span>
              <span className="text-gray-900">{appointment.serviceType}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium flex items-center text-gray-700">
                <User className="mr-2 h-4 w-4 text-rose-500" />
                Artist
              </span>
              <span className="text-gray-900">
                {appointment.artistName || "Not specified"}
              </span>
            </div>

            <div className="flex justify-between font-bold text-lg border-t border-rose-100 pt-4 mt-4 text-rose-700">
              <span>Total Amount</span>
              <span>${appointment.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card className="border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center text-gray-800">
            <Lock className="mr-2 h-5 w-5 text-rose-500" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cardholderName" className="text-gray-700">
                Cardholder Name
              </Label>
              <Input
                id="cardholderName"
                name="cardholderName"
                placeholder="John Doe"
                value={paymentDetails.cardholderName}
                onChange={handleInputChange}
                className={`${
                  errors.cardholderName
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                }`}
                required
              />
              {errors.cardholderName && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.cardholderName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-gray-700">
                Card Number
              </Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="4242 4242 4242 4242"
                  value={paymentDetails.cardNumber}
                  onChange={handleInputChange}
                  className={`pl-11 ${
                    errors.cardNumber
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  maxLength={19}
                  required
                />
                <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.cardNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-gray-700">
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={paymentDetails.expiryDate}
                  onChange={handleInputChange}
                  className={`${
                    errors.expiryDate
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  maxLength={5}
                  required
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.expiryDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-gray-700">
                  Security Code (CVV)
                </Label>
                <Input
                  id="cvv"
                  name="cvv"
                  placeholder="123"
                  type="text"
                  value={paymentDetails.cvv}
                  onChange={handleInputChange}
                  className={`${
                    errors.cvv
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  maxLength={4}
                  required
                />
                {errors.cvv && (
                  <p className="text-sm text-red-500 mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
              <span>Your payment information is secure and encrypted</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t px-6 py-4">
          <div className="w-full space-y-3">
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 transition-colors py-6 text-lg"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay ${appointment.totalPrice.toFixed(2)}</>
              )}
            </Button>
            <p className="text-sm text-center text-gray-500">
              Payment will be sent directly to {appointment.artistName} for the
              service
            </p>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          By proceeding with the payment, you agree to our{" "}
          <a href="#" className="underline text-rose-600 hover:text-rose-700">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
