"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, addDays, isSameDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Save,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extended user interface for typing session.user
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// Availability settings interface
interface AvailabilitySettings {
  isAvailable: boolean; // Whether the artist is available for booking
  workingHours: {
    start: number; // 0-23 hours
    end: number; // 0-24 hours (24 = midnight of next day)
    interval: number; // 15-120 minutes
  };
  regularDaysOff: number[]; // 0 = Sunday, 6 = Saturday
}

// Day of week options
const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Hour options (00:00 - 24:00)
const hourOptions = Array.from({ length: 25 }, (_, i) => {
  const hour = i % 12 === 0 ? 12 : i % 12;
  const amPm = i < 12 ? "AM" : "PM";
  return {
    value: i,
    label: `${hour}:00 ${amPm}`,
  };
});

// Interval options
const intervalOptions = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export default function ArtistAvailabilityPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AvailabilitySettings>({
    isAvailable: true,
    workingHours: {
      start: 10,
      end: 24,
      interval: 30,
    },
    regularDaysOff: [0, 6], // Sunday and Saturday
  });

  const [date, setDate] = useState<Date | undefined>(new Date());

  // Redirect if not artist
  useEffect(() => {
    if (
      status === "authenticated" &&
      (session?.user as ExtendedUser)?.role !== "ARTIST"
    ) {
      router.push("/");
      toast({
        title: "Access Denied",
        description: "Only artists can access this dashboard",
        variant: "destructive",
      });
    }
  }, [session, status, router]);

  // Fetch artist availability settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user || status !== "authenticated") return;

      try {
        setIsLoading(true);
        const response = await fetch("/api/artists/availability/settings");
        const data = await response.json();

        if (response.ok) {
          setSettings(data);
        } else {
          throw new Error(
            data.message || "Failed to fetch availability settings"
          );
        }
      } catch (error) {
        console.error("Error fetching availability settings:", error);
        toast({
          title: "Error",
          description:
            "Could not load availability settings. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user && status === "authenticated") {
      fetchSettings();
    }
  }, [session, status]);

  // Save availability settings
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/artists/availability/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description:
            "Your availability settings have been updated successfully.",
          variant: "success",
        });
      } else {
        throw new Error(data.message || "Failed to save availability settings");
      }
    } catch (error) {
      console.error("Error saving availability settings:", error);
      toast({
        title: "Error",
        description: "Could not save availability settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle availability status
  const toggleAvailability = (value: boolean) => {
    setSettings({
      ...settings,
      isAvailable: value,
    });
  };

  // Toggle a regular day off (weekly)
  const toggleRegularDayOff = (dayValue: number) => {
    if (settings.regularDaysOff.includes(dayValue)) {
      // Remove from regular days off
      setSettings({
        ...settings,
        regularDaysOff: settings.regularDaysOff.filter((d) => d !== dayValue),
      });
    } else {
      // Add to regular days off
      setSettings({
        ...settings,
        regularDaysOff: [...settings.regularDaysOff, dayValue].sort(),
      });
    }
  };

  // If loading or not authenticated
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // If not authenticated
  if (status === "unauthenticated") {
    router.push("/sign-in?callbackUrl=/artist-dashboard/availability");
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Availability Settings</h1>
        <p className="text-gray-500 mt-2">
          Manage your working hours and days off
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Overall Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Availability</CardTitle>
            <CardDescription>
              Set whether you are accepting bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Available for booking</h3>
                <p className="text-sm text-gray-500">
                  {settings.isAvailable
                    ? "You are currently accepting bookings"
                    : "You are not accepting any bookings"}
                </p>
              </div>
              <Switch
                checked={settings.isAvailable}
                onCheckedChange={toggleAvailability}
              />
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
            <CardDescription>Set your daily working hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Select
                  value={settings.workingHours.start.toString()}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      workingHours: {
                        ...settings.workingHours,
                        start: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {hourOptions.slice(0, 24).map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Select
                  value={settings.workingHours.end.toString()}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      workingHours: {
                        ...settings.workingHours,
                        end: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {hourOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-interval">Appointment Interval</Label>
              <Select
                value={settings.workingHours.interval.toString()}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    workingHours: {
                      ...settings.workingHours,
                      interval: parseInt(value),
                    },
                  })
                }
              >
                <SelectTrigger id="appointment-interval">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {intervalOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Regular Days Off */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Days Off</CardTitle>
            <CardDescription>
              Select days of the week you don't work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-2">
              {daysOfWeek.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={settings.regularDaysOff.includes(day.value)}
                    onCheckedChange={() => toggleRegularDayOff(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`}>{day.label}</Label>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="ml-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
