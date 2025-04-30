import SignUpForm from "@/components/auth/SignUpForm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

export default async function SignUpPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-950 dark:to-gray-900">
      <div className="flex-1 flex items-center justify-center">
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

          <div className="mb-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                Join Our Community
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Create an account to discover beauty services and exclusive
                offers
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <SignUpForm />
          </div>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Already have an account?{" "}
              <a
                href="/sign-in"
                className="text-rose-500 hover:text-rose-600 font-medium"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-0 right-0 w-1/3 h-screen hidden lg:block overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-rose-400/20 to-pink-500/20 dark:from-rose-900/20 dark:to-pink-800/20"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-rose-300/10 dark:bg-rose-800/10"></div>
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 rounded-full bg-pink-400/10 dark:bg-pink-700/10"></div>

        {/* Statistics Display in a more subtle way */}
        <div className="absolute bottom-12 right-12 left-12 grid grid-cols-2 gap-4">
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-rose-500 dark:text-rose-400">
              500+
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300">Artists</p>
          </div>
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-rose-500 dark:text-rose-400">
              50k+
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300">Clients</p>
          </div>
        </div>
      </div>
    </main>
  );
}
