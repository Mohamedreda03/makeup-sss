"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  ShoppingCart,
  User,
  Home,
  Info,
  Phone,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigationLinks = [
  { href: "/", label: "HOME", icon: Home },
  { href: "/artists", label: "All Makeup Artists", icon: Palette },
  { href: "/about", label: "ABOUT", icon: Info },
  { href: "/services", label: "Our Services", icon: Palette },
  { href: "/contact", label: "CONTACT", icon: Phone },
];

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="border-l pr-0 sm:max-w-xs">
        <div className="px-7">
          <div className="flex flex-col space-y-5 mt-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center text-base font-medium transition-colors hover:text-pink-500",
                  pathname === link.href
                    ? "text-pink-500 font-semibold"
                    : "text-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.icon && <link.icon className="mr-2 h-4 w-4" />}
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-5">
              <Link
                href="/cart"
                className="flex items-center text-base font-medium transition-colors hover:text-pink-500"
                onClick={() => setIsOpen(false)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Shopping Cart
              </Link>
              <Link
                href="/account"
                className="flex items-center text-base font-medium transition-colors hover:text-pink-500 mt-4"
                onClick={() => setIsOpen(false)}
              >
                <User className="mr-2 h-4 w-4" />
                My Account
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
