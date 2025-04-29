"use client";

import Link from "next/link";
import { UserButton } from "@/components/user-button";
import { MobileNav } from "@/components/mobile-nav";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartCount } from "@/components/cart-count";

const navigationLinks = [
  { href: "/", label: "HOME" },
  { href: "/artists", label: "All Makeup Artists" },
  { href: "/about", label: "ABOUT" },
  { href: "/services", label: "Our Services" },
  { href: "/contact", label: "CONTACT" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="w-full border-b border-gray-200 bg-white">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm text-gray-700 hover:text-pink-500 transition-colors font-medium tracking-wide",
                  pathname === link.href && "text-pink-500 font-semibold"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Cart, User Button & Mobile Navigation */}
          <div className="flex items-center space-x-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                <CartCount />
              </Button>
            </Link>
            <UserButton />
            <MobileNav />
          </div>
        </div>
      </div>
    </div>
  );
}
