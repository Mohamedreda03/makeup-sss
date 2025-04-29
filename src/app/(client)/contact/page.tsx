import { Metadata } from "next";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us - BrideGlam",
  description: "Get in touch with our makeup artists and beauty professionals",
};

export default function ContactPage() {
  return (
    <main className="container max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-12">
        CONTACT US
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left side: Image */}
        <div className="relative h-[450px] w-full rounded-lg overflow-hidden">
          <Image
            src="/images/contact-makeup.jpg"
            alt="Makeup artist applying makeup"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right side: Contact information */}
        <div className="flex flex-col justify-between">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                OUR OFFICE
              </h2>
              <address className="not-italic space-y-1 text-gray-600">
                <p>54709 Wilma Station</p>
                <p>Suite 550, Washington, USA</p>
              </address>
              <div className="mt-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-pink-500" />
                  <p className="text-gray-700">Tel: (555)-555-0123</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-pink-500" />
                  <p className="text-gray-700">
                    Email: brideglam2023@gmail.com
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                CAREERS
              </h2>
              <p className="text-gray-600 mb-4">
                Learn more about our teams and job openings.
              </p>
              <a
                href="/contact#"
                className="inline-block px-6 py-2 bg-pink-200 text-pink-700 rounded-md hover:bg-pink-300 transition-colors"
              >
                Explore Jobs
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="mt-20">
        <h2 className="text-2xl font-semibold text-center mb-10">
          Get In Touch
        </h2>

        <div className="max-w-xl mx-auto border border-gray-100 rounded-lg p-8 shadow-sm">
          <form className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-200"
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Your Email"
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-200"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Your Message"
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-pink-300 text-pink-700 font-medium rounded-md hover:bg-pink-400 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
