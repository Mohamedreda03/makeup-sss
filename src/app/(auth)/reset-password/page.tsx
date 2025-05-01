"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";

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

// Create form schema with password validation
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(100)
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [tokenVerificationLoading, setTokenVerificationLoading] =
    useState(true);

  // Initialize form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid or missing reset token");
        setTokenVerificationLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/verify-reset-token?token=${token}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Invalid or expired token");
        }

        setIsTokenVerified(true);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Invalid or expired token. Please request a new password reset link."
        );
      } finally {
        setTokenVerificationLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) {
      setError("Missing reset token");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(
        "Password reset successful! You can now log in with your new password."
      );

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while resetting your password."
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

          <div className="mb-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                Reset Password
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Create a new secure password for your account
              </p>
            </div>
          </div>

          {tokenVerificationLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 rounded-full border-4 border-rose-200 dark:border-rose-800/30 border-t-rose-500 dark:border-t-rose-400 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-rose-500 dark:text-rose-400" />
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Verifying your reset link...
              </p>
            </div>
          ) : error && !isTokenVerified ? (
            <div className="space-y-6">
              <Alert
                variant="destructive"
                className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
              >
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <AlertDescription>{error}</AlertDescription>
                </div>
              </Alert>

              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Your password reset link is invalid or has expired.
                </p>
              </div>

              <div className="mt-6 flex justify-center">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-rose-500 text-white hover:bg-rose-600 h-10 py-2 px-4"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-6 rounded-lg border border-green-100 dark:border-green-800">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-center">{success}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Redirecting you to sign in page in 3 seconds...
              </p>

              <div className="mt-4 text-center">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-rose-500 text-white hover:bg-rose-600 h-10 py-2 px-4"
                >
                  Go to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">
                          New Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                              type="password"
                              placeholder="••••••••"
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

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                              type="password"
                              placeholder="••••••••"
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

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password Requirements
                    </h4>
                    <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <li className="flex items-center">
                        <span
                          className={`mr-2 h-1.5 w-1.5 rounded-full ${
                            form.watch("password")?.length >= 8
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        ></span>
                        At least 8 characters
                      </li>
                      <li className="flex items-center">
                        <span
                          className={`mr-2 h-1.5 w-1.5 rounded-full ${
                            /[A-Z]/.test(form.watch("password") || "")
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        ></span>
                        One uppercase letter
                      </li>
                      <li className="flex items-center">
                        <span
                          className={`mr-2 h-1.5 w-1.5 rounded-full ${
                            /[a-z]/.test(form.watch("password") || "")
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        ></span>
                        One lowercase letter
                      </li>
                      <li className="flex items-center">
                        <span
                          className={`mr-2 h-1.5 w-1.5 rounded-full ${
                            /[0-9]/.test(form.watch("password") || "")
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        ></span>
                        One number
                      </li>
                      <li className="flex items-center">
                        <span
                          className={`mr-2 h-1.5 w-1.5 rounded-full ${
                            form.watch("password") ===
                              form.watch("confirmPassword") &&
                            form.watch("password")?.length > 0
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        ></span>
                        Passwords match
                      </li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-5 mt-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Resetting Password...</span>
                      </div>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </Form>

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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-0 right-0 w-1/3 h-screen hidden lg:block overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-rose-400/20 to-pink-500/20 dark:from-rose-900/20 dark:to-pink-800/20"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-rose-300/10 dark:bg-rose-800/10"></div>
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 rounded-full bg-pink-400/10 dark:bg-pink-700/10"></div>

        {/* Illustration for Reset Password */}
        <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 opacity-70">
          <div className="w-64 h-64 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
              <div className="w-24 h-24 bg-rose-200 dark:bg-rose-800/40 rounded-full flex items-center justify-center">
                <Lock className="h-10 w-10 text-rose-500 dark:text-rose-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
