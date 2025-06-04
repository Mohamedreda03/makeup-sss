"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Save,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Settings,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  formatTimeToEgypt12h,
  formatDateToEgyptLocale,
} from "@/lib/timezone-config";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

interface AvailabilitySettings {
  workingDays: number[];
  startTime: string;
  endTime: string;
  sessionDuration: number;
  breakBetweenSessions: number;
  isAvailable: boolean;
}

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function ArtistAvailabilityPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // State for availability settings
  const [availabilitySettings, setAvailabilitySettings] =
    useState<AvailabilitySettings>({
      workingDays: [],
      startTime: "09:00",
      endTime: "17:00",
      sessionDuration: 60,
      breakBetweenSessions: 15,
      isAvailable: true,
    });

  // Days of the week
  const daysOfWeek = [
    { value: 0, label: "Sunday", shortLabel: "Sun" },
    { value: 1, label: "Monday", shortLabel: "Mon" },
    { value: 2, label: "Tuesday", shortLabel: "Tue" },
    { value: 3, label: "Wednesday", shortLabel: "Wed" },
    { value: 4, label: "Thursday", shortLabel: "Thu" },
    { value: 5, label: "Friday", shortLabel: "Fri" },
    { value: 6, label: "Saturday", shortLabel: "Sat" },
  ];

  // Session duration options (in minutes)
  const sessionDurationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
    { value: 180, label: "3 hours" },
    { value: 240, label: "4 hours" },
  ];

  const currentUser = session?.user as ExtendedUser | undefined;

  useEffect(() => {
    if (status === "authenticated") {
      // Check if user is an artist
      if (currentUser?.role !== "ARTIST") {
        router.push("/");
        return;
      }
      fetchAvailability();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [session, status, router, currentUser]);
  // Fetch current availability settings
  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/artist/availability");

      if (response.ok) {
        const data = await response.json();
        if (data.data.availabilitySettings) {
          setAvailabilitySettings(data.data.availabilitySettings);
        }
      } else {
        throw new Error("Failed to fetch availability");
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast({
        title: "Error",
        description: "Failed to load availability data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }; // Save availability changes
  const handleSaveChanges = async () => {
    // Validate input before saving
    if (availabilitySettings.workingDays.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one working day",
        variant: "destructive",
      });
      return;
    }

    // Validate end time is after start time
    const start = dayjs(`2000-01-01T${availabilitySettings.startTime}`);
    const end = dayjs(`2000-01-01T${availabilitySettings.endTime}`);
    if (end.isBefore(start) && end.hour() !== 0) {
      // If end time is before start time (and not midnight which is a special case)
      toast({
        title: "Validation Warning",
        description:
          "End time is before start time. This will be treated as spanning across midnight.",
        variant: "default",
      });
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/artist/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(availabilitySettings),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        toast({
          title: "Success",
          description:
            "Your availability settings have been updated successfully!",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save availability");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to save availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle working day toggle
  const toggleWorkingDay = (dayValue: number) => {
    const newWorkingDays = availabilitySettings.workingDays.includes(dayValue)
      ? availabilitySettings.workingDays.filter((day) => day !== dayValue)
      : [...availabilitySettings.workingDays, dayValue].sort();
    setAvailabilitySettings((prev: AvailabilitySettings) => ({
      ...prev,
      workingDays: newWorkingDays,
    }));
    setHasUnsavedChanges(true);
  };
  // Handle settings change
  const handleSettingChange = (
    field: keyof AvailabilitySettings,
    value: string | number | boolean
  ) => {
    setAvailabilitySettings((prev: AvailabilitySettings) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };
  // Calculate total daily sessions
  const calculateDailySessions = () => {
    if (!availabilitySettings.startTime || !availabilitySettings.endTime)
      return 0;

    const start = dayjs(`2000-01-01T${availabilitySettings.startTime}`);
    let end = dayjs(`2000-01-01T${availabilitySettings.endTime}`);

    // Handle times that cross midnight
    if (end.isBefore(start)) {
      end = end.add(1, "day");
    }

    const totalMinutes = end.diff(start, "minute");
    const sessionWithBreak =
      availabilitySettings.sessionDuration +
      availabilitySettings.breakBetweenSessions;

    return Math.floor(totalMinutes / sessionWithBreak);
  };
  // Format time for display with Egyptian timezone
  const formatTime = (timeString: string) => {
    return formatTimeToEgypt12h(timeString);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {" "}
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Availability Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure your working schedule and availability for client bookings.
        </p>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Timezone Note:</strong> All times are displayed and saved in
            Egypt timezone (UTC+2/+3). Clients will see appointment times in
            Egypt timezone regardless of their location.
          </p>
        </div>
      </div>
      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click "Save Changes" to apply your
            updates.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Working Days Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Working Days
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {daysOfWeek.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={availabilitySettings.workingDays.includes(
                      day.value
                    )}
                    onCheckedChange={() => toggleWorkingDay(day.value)}
                  />
                  <Label
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-medium"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Selected: {availabilitySettings.workingDays.length} day
                {availabilitySettings.workingDays.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Working Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={availabilitySettings.startTime}
                  onChange={(e) =>
                    handleSettingChange("startTime", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={availabilitySettings.endTime}
                  onChange={(e) =>
                    handleSettingChange("endTime", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionDuration">Session Duration</Label>
              <select
                id="sessionDuration"
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                value={availabilitySettings.sessionDuration}
                onChange={(e) =>
                  handleSettingChange(
                    "sessionDuration",
                    parseInt(e.target.value)
                  )
                }
              >
                {sessionDurationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakTime">
                Break Between Sessions (minutes)
              </Label>
              <Input
                id="breakTime"
                type="number"
                min="0"
                max="120"
                step="5"
                value={availabilitySettings.breakBetweenSessions}
                onChange={(e) =>
                  handleSettingChange(
                    "breakBetweenSessions",
                    parseInt(e.target.value) || 0
                  )
                }
              />{" "}
            </div>

            {/* Time Preview */}
            {availabilitySettings.startTime && availabilitySettings.endTime && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Time Preview (Egypt Timezone):
                </p>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Start:</strong>{" "}
                    {formatTime(availabilitySettings.startTime)}
                  </p>
                  <p>
                    <strong>End:</strong>{" "}
                    {formatTime(availabilitySettings.endTime)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Times are automatically saved in UTC and displayed in Egypt
                    timezone
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="isAvailable"
                checked={availabilitySettings.isAvailable}
                onCheckedChange={(checked) =>
                  handleSettingChange("isAvailable", checked)
                }
              />
              <Label htmlFor="isAvailable">
                Currently available for bookings
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Summary and Save */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Availability Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {availabilitySettings.workingDays.length}
              </div>
              <div className="text-sm text-blue-600">Working Days</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {calculateDailySessions()}
              </div>
              <div className="text-sm text-green-600">Daily Sessions</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {availabilitySettings.sessionDuration}min
              </div>
              <div className="text-sm text-purple-600">Session Duration</div>
            </div>
          </div>

          {availabilitySettings.workingDays.length > 0 &&
            availabilitySettings.startTime &&
            availabilitySettings.endTime && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Your Schedule Preview:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Working Days:</strong>{" "}
                    {availabilitySettings.workingDays
                      .map(
                        (day) =>
                          daysOfWeek.find((d) => d.value === day)?.shortLabel
                      )
                      .join(", ")}
                  </p>
                  <p>
                    <strong>Working Hours:</strong>{" "}
                    {formatTime(availabilitySettings.startTime)} -{" "}
                    {formatTime(availabilitySettings.endTime)}
                  </p>
                  <p>
                    <strong>Sessions per Day:</strong>{" "}
                    {calculateDailySessions()} sessions (
                    {availabilitySettings.sessionDuration} minutes each)
                  </p>
                  <p>
                    <strong>Break Between Sessions:</strong>{" "}
                    {availabilitySettings.breakBetweenSessions} minutes
                  </p>
                </div>
              </div>
            )}

          {/* Save Button */}
          <Button
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || isSaving}
            className="w-full"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
