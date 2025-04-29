"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const navigationLinks = [
  { href: "/", label: "HOME" },
  { href: "/artists", label: "All Makeup Artists" },
  { href: "/about", label: "ABOUT" },
  { href: "/services", label: "Our Services" },
  { href: "/contact", label: "CONTACT" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
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
  );
}
