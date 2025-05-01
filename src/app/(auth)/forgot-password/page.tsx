"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Create form schema for validation
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setSuccess(
        "If an account exists with this email, you will receive password reset instructions shortly."
      );
      form.reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while sending the password reset email."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-950 dark:to-gray-900">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/images/logo.svg"
                alt="BrideGlam Logo"
                width={40}
                height={40}
                className="rounded"
              />
              <h1 className="text-2xl font-script text-pink-400">BrideGlam</h1>
            </Link>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent">
                  Check Your Email
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  We've sent the password reset instructions to your email
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-6 rounded-lg border border-green-100 dark:border-green-800">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mb-2">
                    <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-center">{success}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Please check your inbox and spam folder. The reset link will
                expire in 1 hour.
              </p>

              <div className="mt-4 text-center">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-rose-500 text-white hover:bg-rose-600 h-10 py-2 px-4"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                    Forgot Password
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    Enter your email address and we'll send you a link to reset
                    your password
                  </p>
                </div>
              </div>

              <div className="relative z-10">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {error && (
                      <Alert
                        variant="destructive"
                        className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                      >
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">
                            Email
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <Input
                                type="email"
                                placeholder="name@example.com"
                                {...field}
                                disabled={isLoading}
                                className="pl-10 py-5 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-rose-500"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full py-5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>

              <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>
                  Remember your password?{" "}
                  <a
                    href="/sign-in"
                    className="text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Sign In
                  </a>
                </p>
                <p className="mt-2">
                  <a
                    href="/sign-up"
                    className="text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Create an account
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-0 right-0 w-1/3 h-screen hidden lg:block overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-rose-400/20 to-pink-500/20 dark:from-rose-900/20 dark:to-pink-800/20"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-rose-300/10 dark:bg-rose-800/10"></div>
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 rounded-full bg-pink-400/10 dark:bg-pink-700/10"></div>

        {/* Illustration for Password Reset */}
        <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 opacity-70">
          <div className="w-64 h-64 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
              <div className="w-24 h-24 bg-rose-200 dark:bg-rose-800/40 rounded-full flex items-center justify-center">
                <Mail className="h-10 w-10 text-rose-500 dark:text-rose-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
