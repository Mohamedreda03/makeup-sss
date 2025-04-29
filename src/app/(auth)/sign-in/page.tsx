import SignInForm from "@/components/auth/SignInForm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              Makeup<span className="text-rose-500">Pro</span>
            </span>
          </div>
          <SignInForm />
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-rose-to-gray-gradient opacity-90 z-10"></div>
        <Image
          src="/images/hero.png"
          alt="Beauty salon"
          fill
          className="object-cover"
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-white p-12">
          <div className="max-w-md space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-lg text-white/90">
              Sign in to your account to book appointments, connect with beauty
              professionals, and manage your beauty journey.
            </p>
            <div className="bg-white/20 p-6 rounded-xl backdrop-blur-sm">
              <blockquote className="italic text-white">
                "I've been using MakeupPro for all my beauty appointments. The
                quality of service and convenience is unmatched!"
              </blockquote>
              <div className="mt-4 font-medium">— Sarah Williams, Client</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
