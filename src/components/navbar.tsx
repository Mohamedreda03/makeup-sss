import Link from "next/link";
import { UserButton } from "@/components/user-button";
import { MobileNav } from "@/components/mobile-nav";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartCount } from "@/components/cart-count";
import NavLinks from "./NavLinks";
import { auth } from "@/lib/auth";
import Image from "next/image";

export async function Navbar() {
  const session = await auth();
  return (
    <div className="w-full border-b border-gray-200 bg-white z-[100] relative">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="BrideGlam Logo"
              width={40}
              height={40}
              className="rounded"
            />
            <h1 className="text-2xl font-script text-pink-400">BrideGlam</h1>
          </Link>

          {/* Desktop Navigation */}
          <NavLinks />

          {/* Cart, User Button & Mobile Navigation */}
          <div className="flex items-center space-x-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                <CartCount />
              </Button>
            </Link>
            <UserButton session={session} />
            <MobileNav />
          </div>
        </div>
      </div>
    </div>
  );
}
