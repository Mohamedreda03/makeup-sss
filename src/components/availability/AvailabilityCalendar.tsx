"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Clock, X, Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Types for available slots
export interface AvailableSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: AvailableSlot;
}

interface AvailabilityCalendarProps {
  availableSlots: AvailableSlot[];
  onSlotsChange: (slots: AvailableSlot[]) => void;
  isLoading?: boolean;
}

// Time options for select dropdowns
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  return {
    value: `${hour.toString().padStart(2, "0")}:${minute}`,
    label: `${displayHour}:${minute} ${ampm}`,
  };
});

export default function AvailabilityCalendar({
  availableSlots = [],
  onSlotsChange,
  isLoading = false,
}: AvailabilityCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startTime: "09:00",
    endTime: "10:00",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Convert available slots to calendar events
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = availableSlots.map((slot) => {
      const slotDate = new Date(slot.date);
      const [startHour, startMinute] = slot.startTime.split(":").map(Number);
      const [endHour, endMinute] = slot.endTime.split(":").map(Number);

      const start = new Date(slotDate);
      start.setHours(startHour, startMinute, 0, 0);

      const end = new Date(slotDate);
      end.setHours(endHour, endMinute, 0, 0);

      return {
        id: slot.id,
        title: slot.isAvailable ? "Available" : "Busy",
        start,
        end,
        resource: slot,
      };
    });

    setEvents(calendarEvents);
  }, [availableSlots]);

  // Handle calendar slot selection
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedDate(slotInfo.start);
    setNewSlot({
      startTime: format(slotInfo.start, "HH:mm"),
      endTime: format(slotInfo.end, "HH:mm"),
    });
    setIsDialogOpen(true);
  };

  // Save new time slot
  const handleSaveSlot = async () => {
    if (!selectedDate) return;

    // Validate time range
    const [startHour, startMinute] = newSlot.startTime.split(":").map(Number);
    const [endHour, endMinute] = newSlot.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes >= endMinutes) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    const newAvailableSlot: AvailableSlot = {
      id: Date.now().toString(),
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      isAvailable: true,
    };

    const updatedSlots = [...availableSlots, newAvailableSlot];

    try {
      setIsSaving(true);
      onSlotsChange(updatedSlots);
      setIsDialogOpen(false);
      setSelectedDate(null);
      setNewSlot({ startTime: "09:00", endTime: "10:00" });

      toast({
        title: "Success",
        description: "Time slot added successfully!",
        variant: "default",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add time slot.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete time slot
  const handleDeleteSlot = (slotId: string) => {
    const updatedSlots = availableSlots.filter((slot) => slot.id !== slotId);
    onSlotsChange(updatedSlots);

    toast({
      title: "Success",
      description: "Time slot deleted successfully!",
      variant: "default",
    });
  };

  // Toggle slot availability
  const handleToggleSlot = (slotId: string) => {
    const updatedSlots = availableSlots.map((slot) =>
      slot.id === slotId ? { ...slot, isAvailable: !slot.isAvailable } : slot
    );
    onSlotsChange(updatedSlots);
  };

  // Custom event style
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource.isAvailable ? "#10b981" : "#ef4444";
    const borderColor = event.resource.isAvailable ? "#059669" : "#dc2626";

    return {
      style: {
        backgroundColor,
        borderColor,
        color: "white",
        border: "none",
        borderRadius: "4px",
        opacity: 0.8,
      },
    };
  };

  // Get upcoming slots for quick view
  const upcomingSlots = availableSlots
    .filter((slot) => new Date(slot.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Availability Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              selectable={!isLoading}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(event: CalendarEvent) => {
                if (window.confirm("Do you want to delete this time slot?")) {
                  handleDeleteSlot(event.id);
                }
              }}
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "day"]}
              defaultView="week"
              step={30}
              timeslots={2}
              min={new Date(2024, 0, 1, 6, 0)}
              max={new Date(2024, 0, 1, 23, 0)}
              messages={{
                allDay: "All Day",
                previous: "◀",
                next: "▶",
                today: "Today",
                month: "Month",
                week: "Week",
                day: "Day",
                agenda: "Agenda",
                date: "Date",
                time: "Time",
                event: "Event",
                noEventsInRange: "No available slots in this range.",
                showMore: (total: number) => `+${total} more`,
              }}
            />
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Busy</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Slots */}
      {upcomingSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Available Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={slot.isAvailable ? "default" : "destructive"}
                    >
                      {slot.isAvailable ? "Available" : "Busy"}
                    </Badge>
                    <span className="font-medium">
                      {format(new Date(slot.date), "PPP")}
                    </span>
                    <span className="text-muted-foreground">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleSlot(slot.id)}
                      disabled={isLoading}
                    >
                      {slot.isAvailable ? "Mark Busy" : "Mark Available"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Time Slot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Available Time Slot</DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <>Add a new time slot for {format(selectedDate, "PPP")}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Select
                  value={newSlot.startTime}
                  onValueChange={(value) =>
                    setNewSlot({ ...newSlot, startTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Select
                  value={newSlot.endTime}
                  onValueChange={(value) =>
                    setNewSlot({ ...newSlot, endTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSlot} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Time Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
