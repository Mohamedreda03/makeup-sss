"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MoreHorizontal,
  Search,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  User,
  Phone,
  Mail,
  Check,
  X,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Data type definitions matching new Prisma schema
type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

interface Booking {
  id: string;
  user_id: string;
  artist_id: string;
  service_type: string;
  service_price: number | null;
  date_time: Date;
  booking_status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
  };
  artist: {
    id: string;
    user_id: string;
    pricing: number | null;
    experience_years: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      image: string | null;
    };
  };
}

function AdminAppointmentsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [bookingToUpdate, setBookingToUpdate] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus>("CONFIRMED");
  const [statusNotes, setStatusNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Ensure newStatus is never undefined or empty
  useEffect(() => {
    if (!newStatus) {
      setNewStatus("PENDING");
    }
  }, [newStatus]);

  // Use debounced search query to prevent excessive filtering on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchInput]);
  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/appointments");
        const data = await response.json();

        if (response.ok) {
          let bookingsArray: Booking[] = [];

          if (Array.isArray(data)) {
            bookingsArray = data;
          } else if (data && Array.isArray(data.bookings)) {
            bookingsArray = data.bookings;
          }

          setBookings(bookingsArray);
          setFilteredBookings(bookingsArray);
        } else {
          throw new Error(data.message || "Failed to fetch bookings");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Could not load bookings. Please try again later.",
          variant: "destructive",
        });
        setBookings([]);
        setFilteredBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [session]);
  // Filter bookings
  useEffect(() => {
    if (!Array.isArray(bookings)) {
      setFilteredBookings([]);
      return;
    }

    let filtered = [...bookings];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (booking) => booking.booking_status === statusFilter
      );
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.service_type?.toLowerCase().includes(query) ||
          booking.artist.user.name?.toLowerCase().includes(query) ||
          booking.user.name?.toLowerCase().includes(query) ||
          booking.user.email?.toLowerCase().includes(query) ||
          booking.user.phone?.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter]);
  // Quick update booking status
  const quickUpdateStatus = async (id: string, status: BookingStatus) => {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local bookings
        setBookings((prevBookings) => {
          if (!Array.isArray(prevBookings)) return [];
          return prevBookings.map((booking) =>
            booking.id === id ? { ...booking, booking_status: status } : booking
          );
        });

        toast({
          title: "Booking Status Updated",
          description: `The booking has been ${status.toLowerCase()} successfully`,
          variant: "default",
        });
      } else {
        throw new Error(data.message || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  // Cancel booking
  const cancelBooking = async (id: string) => {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/appointments/${id}/cancel`, {
        method: "PUT",
      });

      const data = await response.json();

      if (response.ok) {
        // Update local bookings
        setBookings((prevBookings) => {
          if (!Array.isArray(prevBookings)) return [];
          return prevBookings.map((booking) =>
            booking.id === id
              ? { ...booking, booking_status: "CANCELLED" }
              : booking
          );
        });

        toast({
          title: "Booking Cancelled",
          description: "The booking has been cancelled successfully",
          variant: "default",
        });
      } else {
        throw new Error(data.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: "An error occurred while cancelling. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };
  // Update booking status
  const updateBookingStatus = async (
    id: string,
    status: BookingStatus,
    notes?: string
  ) => {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local bookings
        setBookings((prevBookings) => {
          if (!Array.isArray(prevBookings)) return [];
          return prevBookings.map((booking) =>
            booking.id === id ? { ...booking, booking_status: status } : booking
          );
        });

        toast({
          title: "Booking Updated",
          description: "The booking status has been updated successfully",
          variant: "default",
        });
      } else {
        throw new Error(data.message || "Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsUpdateDialogOpen(false);
      setBookingToUpdate(null);
      setStatusNotes("");
    }
  };
  // Handle booking cancellation
  const handleCancelBooking = (id: string) => {
    setBookingToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle status update
  const handleUpdateStatus = (id: string, currentStatus: BookingStatus) => {
    setBookingToUpdate(id);

    // Determine next logical status based on current status
    // PENDING -> CONFIRMED -> COMPLETED
    let nextStatus: BookingStatus = "PENDING";

    switch (currentStatus) {
      case "PENDING":
        nextStatus = "CONFIRMED";
        break;
      case "CONFIRMED":
        nextStatus = "COMPLETED";
        break;
      case "COMPLETED":
        nextStatus = "COMPLETED"; // Can't change from completed
        break;
      case "CANCELLED":
        nextStatus = "PENDING"; // Reset if cancelled
        break;
      default:
        nextStatus = "PENDING"; // Default fallback
    }

    // Ensure we always set a valid status
    setNewStatus(nextStatus);
    setIsUpdateDialogOpen(true);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    // Never allow empty string values for the status filter
    setStatusFilter(value ? value : "all");
  };
  // Determine status color
  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  // Determine status icon
  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 mr-1" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 mr-1" />;
      default:
        return <AlertCircle className="h-4 w-4 mr-1" />;
    }
  };

  // Convert status to text
  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "CONFIRMED":
        return "Confirmed";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  // Search function
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // Check admin permissions
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-xl text-red-700">
              <AlertCircle className="inline-block mr-2 h-5 w-5" />
              Unauthorized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              You must be an administrator to access this page
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => (window.location.href = "/")}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  // Get paginated items
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedBookings = filteredBookings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredBookings.length / pageSize);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        {" "}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Booking Management
        </h1>
        <p className="text-gray-600">View and manage all system bookings</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bookings..."
            className="pl-10"
            value={searchInput}
            onChange={handleSearch}
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredBookings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>{" "}
                <TableBody>
                  {displayedBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium">
                          {booking.user.name || "Guest"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {booking.artist.user.name || "Unassigned"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {format(new Date(booking.date_time), "MMM dd, yyyy")}
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(booking.date_time), "h:mm a")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {booking.service_type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(booking.booking_status)}
                        >
                          <span className="flex items-center">
                            {getStatusIcon(booking.booking_status)}
                            {getStatusText(booking.booking_status)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="mt-1">
                          {" "}
                          <span className="text-gray-500">Total:</span> EGP{" "}
                          {booking.service_price?.toFixed(2) || "0.00"}
                        </p>
                      </TableCell>{" "}
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateStatus(
                                booking.id,
                                booking.booking_status
                              )
                            }
                            className="h-8"
                          >
                            Details
                          </Button>
                          {booking.booking_status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 h-8"
                              onClick={() =>
                                quickUpdateStatus(booking.id, "CONFIRMED")
                              }
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                          )}
                          {(booking.booking_status === "PENDING" ||
                            booking.booking_status === "CONFIRMED") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 h-8"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}{" "}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredBookings.length)} of{" "}
                {filteredBookings.length} bookings
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>{" "}
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Bookings
            </h3>
            <p className="text-gray-500 text-center max-w-sm mb-4">
              {searchInput || statusFilter !== "all"
                ? "No bookings match your search criteria"
                : "There are no bookings in the system yet"}
            </p>
            {searchQuery || statusFilter !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                View All Appointments
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Cancellation Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to reject this appointment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The appointment will be permanently
              cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>{" "}
            <AlertDialogAction
              onClick={() => {
                if (bookingToDelete) {
                  cancelBooking(bookingToDelete);
                }
              }}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Dialog */}
      <AlertDialog
        open={isUpdateDialogOpen}
        onOpenChange={(open) => {
          // Only allow dialog to close if we're not processing
          if (!isProcessing) {
            setIsUpdateDialogOpen(open);

            // If dialog is closing, reset state for next opening
            if (!open && !newStatus) {
              setNewStatus("PENDING");
            }
          }
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            {" "}
            <AlertDialogTitle>Booking Details</AlertDialogTitle>
            <AlertDialogDescription>
              View and manage booking information
            </AlertDialogDescription>
          </AlertDialogHeader>

          {bookingToUpdate && (
            <div className="py-4">
              {" "}
              {/* Customer & Artist Information */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Customer
                  </h3>
                  <p className="font-medium">
                    {bookings.find((b) => b.id === bookingToUpdate)?.user
                      .name || "Guest"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {bookings.find((b) => b.id === bookingToUpdate)?.user
                      .email || "No email"}
                  </p>
                  {bookings.find((b) => b.id === bookingToUpdate)?.user
                    .phone && (
                    <p className="text-sm text-gray-500">
                      {
                        bookings.find((b) => b.id === bookingToUpdate)?.user
                          .phone
                      }
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Artist</h3>
                  <p className="font-medium">
                    {bookings.find((b) => b.id === bookingToUpdate)?.artist.user
                      .name || "Unassigned"}
                  </p>
                </div>
              </div>
              {/* Service & Booking Time */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Date & Time
                  </h3>
                  <p className="font-medium">
                    {format(
                      new Date(
                        bookings.find((b) => b.id === bookingToUpdate)
                          ?.date_time || new Date()
                      ),
                      "MMMM d, yyyy"
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(
                      new Date(
                        bookings.find((b) => b.id === bookingToUpdate)
                          ?.date_time || new Date()
                      ),
                      "h:mm a"
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Service Details
                  </h3>
                  <p className="font-medium">
                    {
                      bookings.find((b) => b.id === bookingToUpdate)
                        ?.service_type
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {" "}
                    EGP{" "}
                    {bookings
                      .find((b) => b.id === bookingToUpdate)
                      ?.service_price?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
              {/* Status Update */}
              <div className="space-y-4 mb-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Update Status
                </h3>
                <Select
                  defaultValue="PENDING"
                  value={newStatus}
                  onValueChange={(value) => {
                    // Prevent empty string values
                    if (value && value.trim().length > 0) {
                      setNewStatus(value as BookingStatus);
                    } else {
                      setNewStatus("PENDING");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  <label htmlFor="status-notes" className="text-sm font-medium">
                    Additional Notes
                  </label>{" "}
                  <Textarea
                    id="status-notes"
                    placeholder="Add notes about the booking or status change..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (bookingToUpdate) {
                  updateBookingStatus(
                    bookingToUpdate,
                    newStatus,
                    statusNotes || undefined
                  );
                }
              }}
              disabled={isProcessing}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminAppointmentsPage;
