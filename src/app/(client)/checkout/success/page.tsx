import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Loader2, CheckCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface OrderSuccessPageProps {
  searchParams: {
    orderId?: string;
  };
}

export default function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const { orderId } = searchParams;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-4 mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Successful!
            </h1>

            {orderId ? (
              <p className="text-gray-600 mb-6">
                Your order #{orderId.slice(0, 8)} has been placed successfully.
                <br />
                We've sent a confirmation to your email.
              </p>
            ) : (
              <p className="text-gray-600 mb-6">
                Your order has been placed successfully.
                <br />
                We've sent a confirmation to your email.
              </p>
            )}

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                What's Next?
              </h2>
              <ul className="text-left text-gray-600 space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mr-2 mt-1">
                    <div className="w-4 h-4 rounded-full bg-rose-500"></div>
                  </div>
                  <p>We're processing your order</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mr-2 mt-1">
                    <div className="w-4 h-4 rounded-full bg-rose-500"></div>
                  </div>
                  <p>You'll receive a shipping confirmation soon</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mr-2 mt-1">
                    <div className="w-4 h-4 rounded-full bg-rose-500"></div>
                  </div>
                  <p>Your products will arrive within 3-5 business days</p>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link href="/products">
                <Button className="w-full bg-rose-500 hover:bg-rose-600">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
