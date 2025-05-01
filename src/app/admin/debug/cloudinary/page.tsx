"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { toast } from "@/hooks/use-toast";

export default function CloudinaryDebugPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [configData, setConfigData] = useState<any>(null);
  const [testImage, setTestImage] = useState<string | null>(null);
  const [isTestingImage, setIsTestingImage] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "ADMIN") {
        router.push("/");
        return;
      }

      // Fetch Cloudinary configuration
      checkConfig();
    } else if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [session, status, router]);

  // Check Cloudinary configuration
  const checkConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cloudinary/check");
      const data = await response.json();
      setConfigData(data);
    } catch (error) {
      console.error("Error checking configuration:", error);
      toast({
        title: "Error",
        description: "Failed to check Cloudinary configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle a test image upload
  const handleTestImageUploaded = (imageUrl: string) => {
    console.log("Test image uploaded:", imageUrl);
    setTestImage(imageUrl);
    setIsTestingImage(false);
    toast({
      title: "Success",
      description: "Test image uploaded successfully.",
      variant: "success",
    });
  };

  // Start test image upload
  const startImageTest = () => {
    setIsTestingImage(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cloudinary Debug</h1>
        <Button variant="outline" onClick={() => router.push("/admin/artists")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Artists
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Cloudinary Configuration</CardTitle>
            <CardDescription>
              Check if Cloudinary is properly configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Configuration Status:</span>
                  {configData.isConfigured ? (
                    <span className="text-green-500 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" /> Configured
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" /> Not Configured
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Cloud Name</p>
                    <p className="text-sm text-gray-600">
                      {configData.configuration.cloudName}
                    </p>
                  </div>
                  <div className="border p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">API Key</p>
                    <p className="text-sm text-gray-600">
                      {configData.configuration.apiKey}
                    </p>
                  </div>
                  <div className="border p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">API Secret</p>
                    <p className="text-sm text-gray-600">
                      {configData.configuration.apiSecret}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">API Connection Test:</span>
                  {configData.pingResult === "Success" ? (
                    <span className="text-green-500 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" /> Connected
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" /> Failed
                    </span>
                  )}
                </div>

                {configData.error && (
                  <div className="bg-red-50 p-3 rounded-md border border-red-200">
                    <p className="text-sm font-medium text-red-700">Error:</p>
                    <p className="text-sm text-red-600">{configData.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Configuration data not available.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkConfig} variant="outline">
              Refresh Configuration
            </Button>
          </CardFooter>
        </Card>

        {/* Image Upload Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Image Upload</CardTitle>
            <CardDescription>
              Upload a test image to verify the upload functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              {isTestingImage ? (
                <AdminImageUpload
                  currentImage={testImage}
                  name="Test"
                  onImageUploaded={handleTestImageUploaded}
                  folder="debug-test"
                  size="lg"
                />
              ) : (
                <>
                  {testImage ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img
                          src={testImage}
                          alt="Test upload"
                          className="h-40 w-40 object-cover rounded-md border"
                        />
                      </div>
                      <div className="w-full overflow-auto p-2 bg-gray-50 rounded-md">
                        <p className="text-xs font-mono break-all">
                          {testImage}
                        </p>
                      </div>
                      <Button onClick={startImageTest} variant="outline">
                        Upload Another Test Image
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={startImageTest}>
                      Start Image Upload Test
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
            <CardDescription>
              Information about the current environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Node Environment:</span>
                <span className="ml-2">
                  {process.env.NODE_ENV || "Not available"}
                </span>
              </div>
              <div>
                <span className="font-semibold">App URL:</span>
                <span className="ml-2">
                  {process.env.NEXT_PUBLIC_APP_URL || "Not set"}
                </span>
              </div>
              <div>
                <span className="font-semibold">Debug Mode:</span>
                <span className="ml-2">
                  {process.env.NEXT_PUBLIC_DEBUG_MODE ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
