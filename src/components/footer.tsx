import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-12 bg-pink-50">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img
                src="/images/logo.svg"
                alt="BrideGlam Logo"
                width={64}
                height={64}
                className="rounded"
              />
              <h2 className="text-2xl font-script text-pink-400">BrideGlam</h2>
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              Welcome to <span className="font-medium">BrideGlam</span>, your
              trusted platform for booking appointments with professional makeup
              artists. We are dedicated to bringing the best beauty services to
              you, ensuring you look your best on your special day.
            </p>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              COMPANY
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-600 hover:text-pink-500 transition"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-pink-500 transition"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-pink-500 transition"
                >
                  Contact us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-pink-500 transition"
                >
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              GET IN TOUCH
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-pink-400" />
                <span className="text-gray-600">+250-784-652-570</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-pink-400" />
                <span className="text-gray-600">BrideGlam502@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            Copyright © {new Date().getFullYear()} BrideGlam - All Right
            Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
