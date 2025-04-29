import SignUpForm from "@/components/auth/SignUpForm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";

export default async function SignUpPage() {
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
          <SignUpForm />
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-rose-to-gray-gradient opacity-90 z-10"></div>
        <Image
          src="/images/hero.png"
          alt="Beauty products"
          fill
          className="object-cover"
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-white p-12">
          <div className="max-w-md space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Join Our Community
            </h1>
            <p className="text-lg text-white/90">
              Create an account to access personalized beauty products, special
              offers, and connect with top-rated makeup artists.
            </p>
            <div className="flex flex-col items-center space-y-8 mt-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-center">
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm">Professional Artists</div>
                </div>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-center">
                  <div className="text-3xl font-bold">50k+</div>
                  <div className="text-sm">Happy Clients</div>
                </div>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-center">
                  <div className="text-3xl font-bold">100+</div>
                  <div className="text-sm">Available Products</div>
                </div>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-center">
                  <div className="text-3xl font-bold">4.9</div>
                  <div className="text-sm">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
