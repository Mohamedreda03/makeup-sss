"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentButtonProps {
  appointmentId: string;
  amount: number;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function PaymentButton({
  appointmentId,
  amount,
  disabled = false,
  onSuccess,
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // Clear payment data with reliable values
      const paymentData = {
        paymentMethod: "credit_card",
        transactionId: `tx_${Date.now()}`,
      };

      console.log("Sending payment request:", paymentData);

      const response = await fetch(
        `/api/appointments/${appointmentId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Payment API error:", errorData);
        throw new Error(
          errorData.error || errorData.details || "Payment failed"
        );
      }

      const data = await response.json();
      console.log("Payment successful:", data);

      // Set paid state
      setIsPaid(true);

      // Show success message
      toast({
        title: "Payment Successful",
        description:
          "Your payment was processed. The artist has been paid and your appointment is completed.",
        variant: "success",
      });

      // Trigger any additional success callbacks
      if (onSuccess) {
        onSuccess();
      }

      // Refresh the page data
      router.refresh();

      // Short delay then redirect to appointments page
      setTimeout(() => {
        router.push("/appointments");
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isPaid) {
    return (
      <Button disabled className="w-full bg-green-600 hover:bg-green-700">
        <CheckCircle className="mr-2 h-4 w-4" />
        Paid Successfully
      </Button>
    );
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing Payment...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay ${amount.toFixed(2)}
        </>
      )}
    </Button>
  );
}
