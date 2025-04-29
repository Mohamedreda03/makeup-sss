"use client";

import Link from "next/link";
import UserNav from "@/components/auth/UserNav";

export default function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="font-bold text-xl mr-6">
          YourApp
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/about" className="transition-colors hover:text-primary">
            About
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-primary"
          >
            Contact
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <UserNav />
        </div>
      </div>
    </nav>
  );
}
