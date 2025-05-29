"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User as UserIcon,
  Phone,
  Mail,
  Check,
  X,
  Users,
  PiggyBank,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Booking,
  BookingStatus,
  DashboardStats,
  PaginationInfo,
  ArtistAccount,
} from "@/types/booking";

// Extended user interface for typing session.user
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function ArtistDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State for booking list and selected booking
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    pageSize: 10,
  });

  // State for booking detail modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<BookingStatus>("PENDING");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // State for dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalCustomers: 0,
    availableBalance: 0,
    totalEarnings: 0,
  });
  const [artistAccount, setArtistAccount] = useState<ArtistAccount | null>(
    null
  );

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
  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!session?.user || status !== "authenticated") return;

      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        if (statusFilter && statusFilter !== "ALL") {
          params.append("status", statusFilter);
        }
        params.append("page", pagination.page.toString());
        params.append("pageSize", pagination.pageSize.toString());

        const response = await fetch(`/api/artist/bookings?${params}`);
        const data = await response.json();
        if (response.ok) {
          setBookings(data.bookings || []);
          setPagination((prev) => ({ ...prev, ...data.pagination }));
        } else {
          throw new Error(data.error || "Failed to fetch bookings");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Could not load bookings. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user && status === "authenticated") {
      fetchBookings();
    }
  }, [session, status, statusFilter, pagination.page, pagination.pageSize]);

  // Fetch artist account
  useEffect(() => {
    if (session?.user && status === "authenticated") {
      fetchArtistAccount();
    }
  }, [session, status]);

  // Calculate dashboard stats
  useEffect(() => {
    if (!bookings.length) return;

    const pendingCount = bookings.filter(
      (b) => b.booking_status === "PENDING"
    ).length;
    const confirmedCount = bookings.filter(
      (b) => b.booking_status === "CONFIRMED"
    ).length;
    const completedCount = bookings.filter(
      (b) => b.booking_status === "COMPLETED"
    ).length;
    const cancelledCount = bookings.filter(
      (b) => b.booking_status === "CANCELLED"
    ).length;

    // Count unique customers
    const uniqueCustomerIds = new Set(bookings.map((b) => b.user_id));
    const customerCount = uniqueCustomerIds.size;

    // Calculate total earnings from completed bookings
    const totalEarnings = bookings
      .filter((b) => b.booking_status === "COMPLETED")
      .reduce((sum, b) => sum + (b.service_price || 0), 0);

    setStats({
      totalBookings: bookings.length,
      pendingBookings: pendingCount,
      confirmedBookings: confirmedCount,
      completedBookings: completedCount,
      cancelledBookings: cancelledCount,
      totalCustomers: customerCount,
      availableBalance: artistAccount?.availableBalance || 0,
      totalEarnings: artistAccount?.totalEarnings || totalEarnings,
    });
  }, [bookings, artistAccount]);
  const fetchArtistAccount = async () => {
    try {
      const response = await fetch("/api/artist/account");
      if (response.ok) {
        const data = await response.json();
        setArtistAccount(data.account);
      }
    } catch (error) {
      console.error("Error fetching artist account:", error);
    }
  };

  // Update booking status and earnings
  const updateBookingStatus = async () => {
    if (!selectedBooking) return;

    try {
      setIsUpdating(true);
      const response = await fetch(
        `/api/bookings/${selectedBooking.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            notes: statusNotes,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Booking status updated to ${getStatusText(newStatus)}`,
          variant: "default",
        });

        // Update local state
        setBookings(
          bookings.map((booking) =>
            booking.id === selectedBooking.id
              ? {
                  ...booking,
                  booking_status: newStatus,
                }
              : booking
          )
        );

        // If booking is completed, update artist earnings
        if (newStatus === "COMPLETED" && selectedBooking.service_price) {
          await updateArtistEarnings(selectedBooking.service_price);
        }

        setIsModalOpen(false);
      } else {
        throw new Error(data.message || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: "Could not update booking status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Update artist earnings when booking is completed
  const updateArtistEarnings = async (amount: number) => {
    try {
      const response = await fetch("/api/artist/earnings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        // Refresh artist account data
        await fetchArtistAccount();
      }
    } catch (error) {
      console.error("Error updating artist earnings:", error);
    }
  };

  // Open booking detail modal
  const openBookingDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.booking_status);
    setStatusNotes("");
    setIsModalOpen(true);
  };

  // Quick status update without opening modal
  const quickUpdateStatus = async (
    booking: Booking,
    newStatus: BookingStatus
  ) => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Booking status updated to ${getStatusText(newStatus)}`,
          variant: "default",
        });

        // Update local state
        setBookings(
          bookings.map((b) =>
            b.id === booking.id ? { ...b, booking_status: newStatus } : b
          )
        );

        // If booking is completed, update artist earnings
        if (newStatus === "COMPLETED" && booking.service_price) {
          await updateArtistEarnings(booking.service_price);
        }
      } else {
        throw new Error(data.message || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: "Could not update booking status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
        return <Clock className="h-4 w-4 mr-1" />;
    }
  };

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
    router.push("/sign-in?callbackUrl=/artist-dashboard");
    return null;
  }

  return (
    <div className="container py-10 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Artist Dashboard</h1>{" "}
      {/* Main Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">Total Bookings</h3>
                <p className="text-3xl font-bold">{stats.totalBookings}</p>
                <div className="flex mt-2 space-x-2 text-xs">
                  <span className="flex items-center text-amber-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {stats.pendingBookings} Pending
                  </span>
                </div>
              </div>
              <Calendar className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">Total Clients</h3>
                <p className="text-3xl font-bold">{stats.totalCustomers}</p>
                <p className="text-xs text-purple-600 mt-2">
                  Unique customers served
                </p>
              </div>
              <Users className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">Total Earnings</h3>
                <div className="font-bold text-3xl text-green-600">
                  EGP {stats.totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  From completed bookings
                </p>
              </div>
              <PiggyBank className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>{" "}
      </div>
      {/* Bookings Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>
              Manage your upcoming and past bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={booking.user.image || undefined}
                              alt={booking.user.name || "Client"}
                            />
                            <AvatarFallback>
                              {booking.user.name?.[0] || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {booking.user.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.user.phone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {format(new Date(booking.date_time), "MMM d, yyyy")}
                          <div className="text-xs text-gray-500">
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
                        <div className="font-medium text-green-600">
                          EGP {(booking.service_price || 0).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`flex items-center w-fit ${getStatusColor(
                            booking.booking_status
                          )}`}
                        >
                          {getStatusIcon(booking.booking_status)}
                          {getStatusText(booking.booking_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {booking.booking_status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                                onClick={() =>
                                  quickUpdateStatus(booking, "CONFIRMED")
                                }
                                title="Confirm Booking"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                onClick={() =>
                                  quickUpdateStatus(booking, "CANCELLED")
                                }
                                title="Cancel Booking"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {booking.booking_status === "CONFIRMED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                              onClick={() =>
                                quickUpdateStatus(booking, "COMPLETED")
                              }
                              title="Mark as Completed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBookingDetail(booking)}
                          >
                            Manage
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No bookings found for the selected filters
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              Showing {bookings.length} of {pagination.total} bookings
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      {/* Booking Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View and manage booking details
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Service</div>
                  <div className="text-gray-900 font-medium">
                    {selectedBooking.service_type}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Price</div>
                  <div className="text-gray-900 font-medium">
                    EGP {(selectedBooking.service_price || 0).toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Date & Time</div>
                  <div>
                    {format(new Date(selectedBooking.date_time), "PPP")}
                    <div className="text-sm text-gray-500">
                      {format(new Date(selectedBooking.date_time), "p")}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Status</div>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedBooking.booking_status)}
                  >
                    {getStatusText(selectedBooking.booking_status)}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">
                  Client Information
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span>{selectedBooking.user.name}</span>
                  </div>
                  {selectedBooking.user.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedBooking.user.email}</span>
                    </div>
                  )}
                  {selectedBooking.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedBooking.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">Update Status</div>
                <Select
                  value={newStatus}
                  onValueChange={(value: BookingStatus) => setNewStatus(value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">
                    Add Note (Optional)
                  </div>
                  <Textarea
                    placeholder="Add a note about this status change..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={3}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={updateBookingStatus} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
