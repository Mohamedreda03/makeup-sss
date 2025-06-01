import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  UserCheck,
  Mail,
  Calendar,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | BrideGlam",
  description:
    "Learn how BrideGlam protects your privacy and handles your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/20 rounded-full">
                <Shield className="h-8 w-8 text-rose-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your privacy is important to us. Learn how we collect, use, and
              protect your information.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Last updated: June 1, 2025
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-8">
            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-5 w-5 text-rose-600" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Information We Collect
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  We collect information you provide directly to us, such as
                  when you create an account, book an appointment, or contact us
                  for support.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Personal Information:</strong> Name, email address,
                    phone number
                  </li>
                  <li>
                    <strong>Account Information:</strong> Username, password,
                    profile preferences
                  </li>
                  <li>
                    <strong>Booking Information:</strong> Appointment details,
                    service preferences
                  </li>
                  <li>
                    <strong>Payment Information:</strong> Billing address and
                    payment method details
                  </li>
                  <li>
                    <strong>Communications:</strong> Messages you send to us or
                    our artists
                  </li>
                </ul>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="h-5 w-5 text-rose-600" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  How We Use Your Information
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process appointments and payments</li>
                  <li>
                    Send you confirmations, updates, and administrative messages
                  </li>
                  <li>
                    Respond to your questions and provide customer support
                  </li>
                  <li>Personalize your experience on our platform</li>
                  <li>
                    Detect, investigate, and prevent fraudulent activities
                  </li>
                </ul>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-rose-600" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Information Sharing and Disclosure
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  We do not sell, trade, or otherwise transfer your personal
                  information to third parties except as described in this
                  policy:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Service Providers:</strong> We share information
                    with artists to fulfill your appointments
                  </li>
                  <li>
                    <strong>Payment Processors:</strong> We use secure
                    third-party payment processors
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> We may disclose
                    information when required by law
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> Information may be
                    transferred in connection with a merger or acquisition
                  </li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-rose-600" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Data Security
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  We implement appropriate technical and organizational security
                  measures to protect your personal information against
                  unauthorized access, alteration, disclosure, or destruction.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication measures</li>
                  <li>Secure payment processing through certified providers</li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="h-5 w-5 text-rose-600" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Your Rights and Choices
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Request a copy of your data</li>
                  <li>Restrict or object to certain processing activities</li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-5 w-5 text-rose-600" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Cookies and Tracking
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  We use cookies and similar tracking technologies to enhance
                  your experience, analyze usage, and personalize content. You
                  can control cookie preferences through your browser settings.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-5 w-5 text-rose-600" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Contact Us
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  If you have any questions about this Privacy Policy or our
                  privacy practices, please contact us:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p>
                    <strong>Email:</strong> privacy@brideglam.com
                  </p>
                  <p>
                    <strong>Address:</strong> BrideGlam Privacy Office, Cairo,
                    Egypt
                  </p>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Changes to This Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new Privacy
                Policy on this page and updating the "Last updated" date above.
              </p>
            </section>
          </div>

          {/* Footer CTA */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Return to BrideGlam
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
