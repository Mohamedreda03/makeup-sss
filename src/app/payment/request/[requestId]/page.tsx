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
  User,
  Loader2,
  ShieldCheck,
  Lock,
  AlertCircle,
} from "lucide-react";

// Define appointment request type
interface AppointmentRequest {
  tempId: string;
  userId: string;
  artistId: string;
  artistName: string;
  datetime: string;
  serviceType: string;
  totalPrice: number;
  location?: string;
  status: string;
  created: string;
}

export default function PaymentRequestPage() {
  const router = useRouter();
  const { requestId } = useParams();
  const { data: session } = useSession();
  const [appointmentRequest, setAppointmentRequest] =
    useState<AppointmentRequest | null>(null);
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

  // Retrieve appointment request from localStorage or session storage
  useEffect(() => {
    const fetchAppointmentRequest = async () => {
      if (!session?.user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue with payment",
          variant: "destructive",
        });
        router.push("/sign-in");
        return;
      }

      try {
        // In a real implementation, you would fetch this from server storage
        // For now, we'll simulate by looking for the request in localStorage
        const storedRequestData = localStorage.getItem(
          `appointment-request-${requestId}`
        );

        if (storedRequestData) {
          const requestData = JSON.parse(storedRequestData);
          setAppointmentRequest(requestData);
        } else {
          // If not found in local storage, try to fetch from your API
          // This would be a real implementation in production
          toast({
            title: "Request Not Found",
            description:
              "The appointment request could not be found. Please try booking again.",
            variant: "destructive",
          });
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching appointment request:", error);
        toast({
          title: "Error",
          description: "Could not load appointment request details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointmentRequest();
  }, [requestId, session, router]);

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

  // Process payment and create appointment
  const handlePayment = async () => {
    if (!appointmentRequest || !session?.user) return;

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
      // Make sure datetime is in the correct format for Africa/Cairo timezone
      let datetimeValue = appointmentRequest.datetime;
      
      console.log("Original datetime from request:", datetimeValue);
      console.log("Type of datetime:", typeof datetimeValue);
      
      // If it's a Date object, convert it properly
      if (typeof datetimeValue === "object" && datetimeValue !== null) {
        const dateObj = new Date(datetimeValue);
        // Format as local time in Africa/Cairo timezone (YYYY-MM-DDTHH:mm:ss+02:00)
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        
        datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+02:00`;
      } else if (typeof datetimeValue === "string") {
        // If it's already a string, check if it has timezone info
        if (!datetimeValue.includes('+') && !datetimeValue.includes('Z')) {
          // Add Cairo timezone offset if no timezone info
          datetimeValue = datetimeValue + '+02:00';
        }
      }
      
      console.log("Processed datetime for API:", datetimeValue);

      // Create the appointment using the validated appointment request
      const appointmentData = {
        artistId: appointmentRequest.artistId,
        serviceType: appointmentRequest.serviceType,
        datetime: datetimeValue,
        totalPrice: appointmentRequest.totalPrice,
        // Handle location correctly - if it's null or undefined, don't include it
        ...(appointmentRequest.location
          ? { location: appointmentRequest.location }
          : {}),
        status: "CONFIRMED",
      };

      console.log("Sending appointment data:", appointmentData);

      // First, create the appointment
      const appointmentResponse = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (!appointmentResponse.ok) {
        const errorData = await appointmentResponse.json();
        console.error("Appointment creation failed:", errorData);
        throw new Error(errorData.message || "Failed to create appointment");
      }

      const appointmentResult = await appointmentResponse.json();
      const appointmentId = appointmentResult.appointment.id;

      // Next, process the payment
      const paymentResponse = await fetch(
        `/api/appointments/${appointmentId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethod: "credit_card",
            transactionId: `tx_${Date.now()}`,
            // In a real app, you'd send tokenized payment info from a payment processor
          }),
        }
      );

      if (!paymentResponse.ok) {
        throw new Error("Payment processing failed");
      }

      // Clean up the temporary request
      localStorage.removeItem(`appointment-request-${requestId}`);

      toast({
        title: "Booking Successful!",
        description: "Your appointment has been booked and payment processed",
      });

      // Redirect to appointments page
      setTimeout(() => {
        router.push("/appointments");
      }, 2000);
    } catch (error) {
      console.error("Payment/Booking error:", error);
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!appointmentRequest) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <Card className="border-rose-200 bg-rose-50">
          <CardHeader>
            <CardTitle className="text-rose-700 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Appointment Request Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-rose-600 mb-4">
              We couldn't find the appointment request you're looking for. It
              may have expired or been cancelled.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-center mb-8">
        Complete Your Booking
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appointment Summary */}
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle>Appointment Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-gray-600">
                    {appointmentRequest.datetime
                      ? format(
                          new Date(appointmentRequest.datetime),
                          "MMMM d, yyyy 'at' h:mm a"
                        )
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="font-medium">Artist</p>
                  <p className="text-gray-600">
                    {appointmentRequest.artistName}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="font-medium">Service</p>
                  <p className="text-gray-600">
                    {appointmentRequest.serviceType}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Total Price</p>
                  <p className="font-bold text-green-600 text-xl">
                    EGP {appointmentRequest.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentDetails.cardNumber}
                    onChange={handleInputChange}
                    className={`pl-10 ${
                      errors.cardNumber ? "border-red-500" : ""
                    }`}
                  />
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm">{errors.cardNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  name="cardholderName"
                  placeholder="John Doe"
                  value={paymentDetails.cardholderName}
                  onChange={handleInputChange}
                  className={errors.cardholderName ? "border-red-500" : ""}
                />
                {errors.cardholderName && (
                  <p className="text-red-500 text-sm">
                    {errors.cardholderName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={paymentDetails.expiryDate}
                    onChange={handleInputChange}
                    className={errors.expiryDate ? "border-red-500" : ""}
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-sm">{errors.expiryDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <div className="relative">
                    <Input
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      value={paymentDetails.cvv}
                      onChange={handleInputChange}
                      className={`pl-10 ${errors.cvv ? "border-red-500" : ""}`}
                    />
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.cvv && (
                    <p className="text-red-500 text-sm">{errors.cvv}</p>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-rose-600 hover:bg-rose-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Processing
                    </>
                  ) : (
                    <>Pay EGP {appointmentRequest.totalPrice.toFixed(2)}</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full mt-2"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-center text-sm text-gray-500">
            <div className="flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-gray-400" />
              Your payment information is secure and encrypted
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
