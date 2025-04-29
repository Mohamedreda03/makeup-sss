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
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format. Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (response?.error) {
        // First check for exact error messages

        console.log(response);

        if (response.error === "Invalid password") {
          setErrorMessage(
            "Incorrect password. The password you entered is incorrect. Please try again."
          );
          console.log("Handling invalid password error");
        } else if (response.error.includes("Invalid password")) {
          setErrorMessage(
            "Incorrect password. The password you entered is incorrect. Please try again."
          );
          console.log("Handling invalid password error (includes)");
        } else if (response.error === "Configuration") {
          setErrorMessage(
            "Email or password is incorrect. Please check your credentials and try again."
          );
          console.log("Handling Configuration error - likely invalid email");
        } else if (
          response.error.includes("database") ||
          response.error.includes("connect")
        ) {
          setErrorMessage(
            "Unable to connect to the system. Please try again later when the service is available."
          );
        } else if (response.error.startsWith("Authentication failed")) {
          setErrorMessage(
            "Login failed. Please check your email and password and try again."
          );
        }
        // Then check for other error patterns
        else if (
          response.error.includes("not found") ||
          response.error.includes("not exist") ||
          response.error.includes("no user")
        ) {
          setErrorMessage(
            "Email not registered. This email address is not registered in our system. Please check the email or create a new account."
          );
        } else if (
          response.error.includes("password") ||
          response.error.includes("credentials") ||
          response.error.includes("invalid")
        ) {
          setErrorMessage(
            "Incorrect password. The password you entered is wrong. Please try again with the correct password."
          );
        } else if (response.error.includes("email")) {
          setErrorMessage("Invalid email. Please enter a valid email address.");
        } else if (
          response.error.includes("verify") ||
          response.error.includes("verification")
        ) {
          setErrorMessage(
            "Email not verified. Please check your inbox and verify your email before signing in."
          );
        } else {
          // Make even the generic error more user-friendly
          setErrorMessage(
            "Sign-in error: " +
              response.error +
              ". Please try again or contact support if the problem persists."
          );
        }
        return;
      }

      toast.success("Signed in successfully!");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign in error:", error);
      setErrorMessage(
        "Connection error. Unable to connect to authentication service. Please check your internet connection and try again later."
      );
      toast.error("Something went wrong during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setErrorMessage(null);

    signIn("google", { callbackUrl: "/" }).catch((error) => {
      setIsLoading(false);
      setErrorMessage(
        "Google sign-in failed. Unable to authenticate with Google. Please try again or use email and password."
      );
      toast.error("Something went wrong with Google sign in");
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
          Welcome back
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Enter your credentials to sign in to your account
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

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 py-5 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p className="text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Button
            variant="link"
            className="p-0 font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-500"
            onClick={() => router.push("/sign-up")}
          >
            Sign up
          </Button>
        </p>

        <Button
          variant="link"
          className="p-0 mt-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={() => router.push("/forgot-password")}
        >
          Forgot your password?
        </Button>
      </div>
    </div>
  );
}
