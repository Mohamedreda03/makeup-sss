import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Us - BrideGlam",
  description:
    "Learn more about BrideGlam and our professional makeup services",
};

const features = [
  {
    title: "Efficiency",
    description:
      "Streamlined appointment scheduling with top makeup artists that fits seamlessly into your busy schedule.",
  },
  {
    title: "Convenience",
    description:
      "Access to a network of trusted and skilled makeup artists near you, ensuring that you get the best service.",
  },
  {
    title: "Personalization",
    description:
      "Tailored recommendations based on your preferences, along with timely reminders, to help you stay on top of your beauty routine.",
  },
  {
    title: "Quality",
    description:
      "We connect you with professionals who are passionate about delivering the best results, ensuring that every makeup session exceeds your expectations.",
  },
];

export default function AboutPage() {
  return (
    <main className="container max-w-7xl mx-auto px-4 py-16">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800">
          ABOUT <span className="text-pink-500">US</span>
        </h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
        {/* Left side: Images */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Image
              src="/images/about-makeup-1.jpg"
              alt="Makeup artist applying makeup"
              width={600}
              height={300}
              className="rounded-lg object-cover h-64 w-full"
            />
          </div>
          <div>
            <Image
              src="/images/about-makeup-2.jpg"
              alt="Makeup brushes"
              width={280}
              height={200}
              className="rounded-lg object-cover h-40 w-full"
            />
          </div>
          <div>
            <Image
              src="/images/about-makeup-3.jpg"
              alt="Makeup session"
              width={280}
              height={200}
              className="rounded-lg object-cover h-40 w-full"
            />
          </div>
        </div>

        {/* Right side: Content */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <p className="text-gray-700 mb-6">
              Welcome to BrideGlam, your trusted platform for booking
              appointments with the best Makeup Artists in a convenient and
              efficient way. At BrideGlam, we understand the challenges people
              face when booking makeup appointments or choosing the right artist
              for their needs.
            </p>
            <p className="text-gray-700 mb-6">
              BrideGlam is committed to providing top-notch services in the
              beauty and makeup industry. We are continuously improving our
              platform by integrating the latest technologies to enhance user
              experience and deliver outstanding service. Whether you are
              booking your first appointment or maintaining your ongoing beauty
              routine, BrideGlam is here to support you every step of the way.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-4">
              Our Vision
            </h2>
            <p className="text-gray-700">
              At BrideGlam, our vision is to create a seamless beauty experience
              for every user. We aim to bridge the gap between clients and
              Makeup Artists, making it easier for you to access the service you
              need, whenever you need it.
            </p>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">WHY CHOOSE US</h2>

        <div className="bg-pink-50 rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-start">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {feature.title}:
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
