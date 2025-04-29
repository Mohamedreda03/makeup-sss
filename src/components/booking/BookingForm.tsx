"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Clock, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";

// Service type definition
interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

// Form schema
const bookingFormSchema = z.object({
  serviceId: z.string({ required_error: "Please select a service" }),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string({ required_error: "Please select a time" }),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Generate mock time slots for demonstration
const generateTimeSlots = () => {
  return [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ];
};

interface BookingFormProps {
  artistId: string;
  services: Service[];
  isUserLoggedIn: boolean;
  defaultPrice?: number; // Add default price
}

export default function BookingForm({
  artistId,
  services,
  isUserLoggedIn,
  defaultPrice = 0, // Default price fallback
}: BookingFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Set default selected service to the first one or use the artist's default price
  useEffect(() => {
    if (services && services.length > 0) {
      setSelectedService(services[0]);
    } else if (defaultPrice > 0) {
      // Create a default service based on the artist's default price
      setSelectedService({
        id: "default",
        name: "Standard Service",
        description: "Standard service with this artist",
        price: defaultPrice,
        duration: 60,
      });
    }
  }, [services, defaultPrice]);

  // Form definition
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Get selected service
  const selectedServiceId = form.watch("serviceId");

  // Handle form submission
  const onSubmit = async (data: BookingFormValues) => {
    if (!isUserLoggedIn) {
      setShowLoginDialog(true);
      return;
    }

    try {
      setIsLoading(true);

      // Get the selected service details
      const serviceToBook = selectedService || {
        id: "default",
        name: "Standard Service",
        price: defaultPrice,
        duration: 60,
      };

      // Parse time from string if needed
      const timeStr = data.time;

      // Create the appointment datetime
      const appointmentDate = data.date;
      const [hours, minutes] = timeStr.split(":").map(Number);
      appointmentDate.setHours(hours);
      appointmentDate.setMinutes(minutes);

      // Prepare the appointment data
      const appointmentData = {
        artistId,
        serviceId: serviceToBook.id,
        serviceType: serviceToBook.name,
        datetime: appointmentDate.toISOString(),
        duration: serviceToBook.duration,
        totalPrice: serviceToBook.price, // Use the service price or default price
        notes: data.notes || "",
      };

      // Make the API call to create the appointment
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        throw new Error("Failed to book appointment");
      }

      // Show success toast
      toast({
        title: "تم الحجز بنجاح!",
        description: "تم جدولة موعدك بنجاح.",
        variant: "success",
      });

      // Redirect to appointments page
      router.push("/appointments");
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "فشل الحجز",
        description: "حدث خطأ أثناء محاولة حجز موعدك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Available time slots
  const timeSlots = generateTimeSlots();

  // Display service price card with the selected service info
  const ServicePriceCard = () => {
    if (!selectedService) return null;

    return (
      <Card className="mb-4 border-green-100 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">
                {selectedService.name}
              </h3>
              <p className="text-sm text-green-700">
                {selectedService.description}
              </p>
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-green-700">
                  <span className="font-semibold">
                    ${selectedService.price}
                  </span>{" "}
                  · {selectedService.duration} min
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {showLoginDialog && (
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign In Required</AlertDialogTitle>
              <AlertDialogDescription>
                You need to be signed in to book an appointment. Would you like
                to sign in now?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowLoginDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  router.push("/sign-in");
                }}
              >
                Sign In
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Service Price Card - Show at the top */}
      {selectedService && <ServicePriceCard />}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const newService = services.find(
                      (service) => service.id === value
                    );
                    if (newService) {
                      setSelectedService(newService);
                    }
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex justify-between w-full">
                          <span>{service.name}</span>
                          <span className="text-green-600 font-medium">
                            ${service.price}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() ||
                        date >
                          new Date(
                            new Date().setMonth(new Date().getMonth() + 3)
                          )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any special requests or information the artist should know"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional: Include any special requirements or preferences for
                  your appointment.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedService && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
              <h4 className="font-medium text-gray-900 mb-2">
                Booking Summary
              </h4>
              <p className="mb-1">
                <span className="font-medium">Service:</span>{" "}
                {selectedService.name}
              </p>
              <p className="mb-1">
                <span className="font-medium">Duration:</span>{" "}
                {selectedService.duration} minutes
              </p>
              <p>
                <span className="font-medium">Price:</span> $
                {selectedService.price}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Booking..." : "Book Appointment"}
          </Button>

          {!isUserLoggedIn && (
            <p className="text-sm text-gray-500 text-center mt-2">
              You need to be logged in to book an appointment.
            </p>
          )}
        </form>
      </Form>
    </>
  );
}
