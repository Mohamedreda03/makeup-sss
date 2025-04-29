"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required. Please enter your full name."),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format. Please enter a valid email address."),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters long for security."),
    confirmPassword: z
      .string()
      .min(
        1,
        "Password confirmation is required. Please confirm your password."
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message:
      "Passwords do not match. Please make sure both passwords are identical.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error types with detailed messages
        if (response.status === 409) {
          setErrorMessage(
            "Email already registered. This email address is already in use. Please sign in instead or use a different email address."
          );
          return;
        } else if (response.status === 400) {
          if (errorData.message?.includes("email")) {
            setErrorMessage(
              "Invalid email address format. Please provide a valid email address."
            );
            return;
          } else if (errorData.message?.includes("password")) {
            setErrorMessage(
              "Invalid password format. Password must be at least 6 characters long and meet security requirements."
            );
            return;
          } else if (errorData.message?.includes("name")) {
            setErrorMessage(
              "Invalid name format. Please provide your full name."
            );
            return;
          } else {
            setErrorMessage(
              errorData.message ||
                "Invalid registration data. Please check all information and try again."
            );
            return;
          }
        } else if (response.status === 429) {
          setErrorMessage(
            "Too many registration attempts. Please try again later."
          );
          return;
        } else if (response.status >= 500) {
          setErrorMessage(
            "Server error. Our system is currently unavailable. Please try again later."
          );
          return;
        } else {
          setErrorMessage(
            errorData.message ||
              "Registration failed. Please try again later or contact support."
          );
          return;
        }
      }

      setSuccessMessage(
        "Account created successfully! You can now sign in to your account."
      );

      // Sign in the user after successful registration
      const signInResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setErrorMessage(
          "Account created successfully, but we couldn't sign you in automatically. Please try signing in manually with your new credentials."
        );
        toast.error("Account created but couldn't sign in automatically");

        // Redirect to sign-in page after a delay
        setTimeout(() => {
          router.push("/sign-in");
        }, 3000);
        return;
      }

      toast.success("Registration successful! Welcome to our platform.");

      // Success, redirect after a short delay
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Connection error. Unable to connect to registration service. Please check your internet connection and try again later."
      );
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    signIn("google", { callbackUrl: "/" }).catch((error) => {
      setIsLoading(false);
      setErrorMessage(
        "Google sign-up failed. Unable to authenticate with Google. Please try again or use email and password to create an account."
      );
      toast.error("Something went wrong with Google sign in");
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
          Create an account
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Enter your information to create a new account
        </p>
      </div>

      {errorMessage && (
        <Alert
          variant="destructive"
          className="bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        className="w-full flex items-center gap-2 py-5 border-gray-300 dark:border-gray-600"
        onClick={handleGoogleSignIn}
      >
        <FcGoogle className="h-5 w-5" />
        <span>Continue with Google</span>
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-800 px-2 text-xs uppercase text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 dark:text-gray-300">
                  Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      placeholder="Your full name"
                      className="pl-10 py-5 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-rose-500"
                      disabled={isLoading}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      placeholder="name@example.com"
                      type="email"
                      className="pl-10 py-5 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-rose-500"
                      disabled={isLoading}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 dark:text-gray-300">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 py-5 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-rose-500"
                      disabled={isLoading}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
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
                      placeholder="••••••••"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-10 py-5 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-rose-500"
                      disabled={isLoading}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword
                          ? "Hide password"
                          : "Show password"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 py-5 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p className="text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Button
            variant="link"
            className="p-0 font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-500"
            onClick={() => router.push("/sign-in")}
          >
            Sign in
          </Button>
        </p>
      </div>
    </div>
  );
}
