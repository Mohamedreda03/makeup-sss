import { Metadata } from "next";
import { Sparkles, Heart, Flower2, Paintbrush } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Services - BrideGlam",
  description: "Discover our professional makeup and beauty services",
};

const services = [
  {
    title: "Bridal Makeup",
    description:
      "Perfect look for your special day. Long-lasting and camera-ready.",
    icon: Paintbrush,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
  },
  {
    title: "Evening Glam",
    description:
      "Get ready for parties or events with bold and glamorous looks.",
    icon: Sparkles,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    title: "Soft/Natural Look",
    description:
      "Enhance your natural beauty with a soft and subtle makeup style.",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
  },
  {
    title: "Henna & Hair Styling",
    description:
      "Henna art and trendy hairstyles to complete your entire look.",
    icon: Flower2,
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
];

export default function ServicesPage() {
  return (
    <main className="container max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-pink-500 mb-6">Our Services</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          At BrideGlam, we offer a range of professional makeup and beauty
          services to help you look and feel your best for any occasion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {services.map((service, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center h-full flex flex-col items-center transition-transform hover:shadow-md hover:-translate-y-1"
          >
            <div className={`p-4 rounded-full ${service.bgColor} mb-4`}>
              <service.icon className={`h-8 w-8 ${service.color}`} />
            </div>
            <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
            <p className="text-gray-600 text-sm">{service.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Ready to Transform Your Look?
        </h2>
        <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
          Our professional makeup artists are here to bring your vision to life.
          Book an appointment today and experience the BrideGlam difference.
        </p>
        <div className="flex justify-center">
          <Link
            href="/artists"
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            Book an Appointment
          </Link>
        </div>
      </div>
    </main>
  );
}
