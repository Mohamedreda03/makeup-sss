"use client";

import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative bg-gradient-to-tr from-gray-900 to-gray-800 text-white pt-16 pb-8">
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-rose-gradient"></div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg"
        aria-label="Scroll to top"
      >
        <ArrowUp size={20} />
      </button>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Column 1 - About */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xl font-bold mb-2">
              Makeup<span className="text-rose-400">Pro</span>
            </h3>
            <p className="text-gray-300 text-sm max-w-xs">
              Connecting beauty professionals with clients to provide
              top-quality makeup and beauty products for any occasion.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-rose-500 transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-rose-500 transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-rose-500 transition-colors"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-rose-500 transition-colors"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div className="flex flex-col space-y-2">
            <h4 className="text-lg font-medium mb-3 text-white relative inline-flex pb-2 before:content-[''] before:absolute before:bottom-0 before:w-12 before:h-0.5 before:bg-rose-500">
              Quick Links
            </h4>
            <Link
              href="/about"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              About Us
            </Link>
            <Link
              href="/products"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Products
            </Link>
            <Link
              href="/artists"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Our Artists
            </Link>
            <Link
              href="/pricing"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Contact Us
            </Link>
          </div>

          {/* Column 3 - Products */}
          <div className="flex flex-col space-y-2">
            <h4 className="text-lg font-medium mb-3 text-white relative inline-flex pb-2 before:content-[''] before:absolute before:bottom-0 before:w-12 before:h-0.5 before:bg-rose-500">
              Our Products
            </h4>
            <Link
              href="/products/makeup"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Makeup
            </Link>
            <Link
              href="/products/skincare"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Skincare
            </Link>
            <Link
              href="/products/haircare"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Haircare
            </Link>
            <Link
              href="/products/fragrance"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Fragrance
            </Link>
            <Link
              href="/products/tools"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Beauty Tools
            </Link>
            <Link
              href="/products/sets"
              className="text-gray-300 hover:text-rose-300 transition-colors py-1"
            >
              Gift Sets
            </Link>
          </div>

          {/* Column 4 - Contact */}
          <div className="flex flex-col space-y-5">
            <h4 className="text-lg font-medium mb-3 text-white relative inline-flex pb-2 before:content-[''] before:absolute before:bottom-0 before:w-12 before:h-0.5 before:bg-rose-500">
              Contact Us
            </h4>
            <div className="flex items-start space-x-3">
              <MapPin className="text-rose-400 mt-1 flex-shrink-0" size={18} />
              <span className="text-gray-300 text-sm">
                123 Beauty Street, Makeup City, MC 12345
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="text-rose-400 flex-shrink-0" size={18} />
              <span className="text-gray-300 text-sm">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="text-rose-400 flex-shrink-0" size={18} />
              <span className="text-gray-300 text-sm">info@makeuppro.com</span>
            </div>

            {/* Newsletter Subscribe */}
            <div className="pt-3">
              <h5 className="text-sm font-medium mb-2">
                Subscribe to our newsletter
              </h5>
              <div className="flex mt-1">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-grow bg-gray-700 text-white text-sm rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
                <Button className="rounded-l-none bg-rose-500 hover:bg-rose-600 border-none">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section with Divider */}
        <div className="border-t border-gray-700 pt-8 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} MakeupPro. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="/terms"
                className="text-gray-400 hover:text-rose-300 text-sm"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="text-gray-400 hover:text-rose-300 text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="/faq"
                className="text-gray-400 hover:text-rose-300 text-sm"
              >
                FAQ
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
