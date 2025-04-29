"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

// Data type definitions
type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

// Extended user interface for typing session.user
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface Appointment {
  id: string;
  datetime: string;
  description: string | null;
  status: AppointmentStatus;
  userId: string;
  artistId: string | null;
  serviceType: string;
  duration: number;
  totalPrice: number;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
  };
}

interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  pageSize: number;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State for appointment list and selected appointment
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // State for appointment detail modal
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<AppointmentStatus>("PENDING");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session?.user || status !== "authenticated") return;

      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        if (statusFilter && statusFilter !== "ALL") {
          params.append("status", statusFilter);
        }

        params.append("page", pagination.page.toString());
        params.append("pageSize", pagination.pageSize.toString());

        if (selectedDate) {
          params.append("date", selectedDate);
        }

        const response = await fetch(
          `/api/appointments/artist?${params.toString()}`
        );
        const data = await response.json();

        if (response.ok) {
          setAppointments(data.appointments);
          setPagination(data.pagination);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to fetch appointments",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast({
          title: "Error",
          description: "Something went wrong while fetching appointments",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [
    session,
    status,
    statusFilter,
    pagination.page,
    pagination.pageSize,
    selectedDate,
  ]);

  // Update appointment status
  const updateAppointmentStatus = async () => {
    if (!selectedAppointment) return;

    try {
      setIsUpdating(true);
      const response = await fetch(
        `/api/appointments/${selectedAppointment.id}`,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update appointment status"
        );
      }

      const updatedAppointment = await response.json();
      console.log("Successfully updated appointment:", updatedAppointment);

      toast({
        title: "Success",
        description: `Appointment status updated to ${getStatusText(
          newStatus
        )}`,
        variant: "success",
      });

      // Update local state with the data returned from the API
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === selectedAppointment.id ? updatedAppointment : app
        )
      );

      // Close modal
      setIsModalOpen(false);

      // Refresh appointments to ensure we have the most up-to-date data
      const fetchUpdatedAppointments = async () => {
        try {
          const params = new URLSearchParams();
          if (statusFilter && statusFilter !== "ALL") {
            params.append("status", statusFilter);
          }
          params.append("page", pagination.page.toString());
          params.append("pageSize", pagination.pageSize.toString());
          if (selectedDate) {
            params.append("date", selectedDate);
          }

          const refreshResponse = await fetch(
            `/api/appointments/artist?${params.toString()}`
          );

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            setAppointments(refreshData.appointments);
            setPagination(refreshData.pagination);
          }
        } catch (refreshError) {
          console.error("Error refreshing appointments:", refreshError);
        }
      };

      fetchUpdatedAppointments();
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while updating status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open appointment detail modal
  const openAppointmentDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.status);
    setStatusNotes(appointment.notes || "");
    setIsModalOpen(true);
  };

  // Quick status update without opening modal
  const quickUpdateStatus = async (
    appointment: Appointment,
    newStatus: AppointmentStatus
  ) => {
    try {
      console.log(
        `Updating appointment ${appointment.id} to status: ${newStatus}`
      );

      const response = await fetch(
        `/api/appointments/${appointment.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Status update successful:", data);

        toast({
          title: "Status Updated",
          description: `Appointment status updated to ${getStatusText(
            newStatus
          )}`,
          variant: "success",
        });

        // Update local state
        setAppointments((prev) =>
          prev.map((app) =>
            app.id === appointment.id ? { ...app, status: newStatus } : app
          )
        );

        // Refresh appointments list after status update
        const fetchUpdatedAppointments = async () => {
          try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== "ALL") {
              params.append("status", statusFilter);
            }
            params.append("page", pagination.page.toString());
            params.append("pageSize", pagination.pageSize.toString());
            if (selectedDate) {
              params.append("date", selectedDate);
            }

            const refreshResponse = await fetch(
              `/api/appointments/artist?${params.toString()}`
            );

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setAppointments(refreshData.appointments);
              setPagination(refreshData.pagination);
            }
          } catch (error) {
            console.error("Error refreshing appointments:", error);
          }
        };

        fetchUpdatedAppointments();
      } else {
        console.error("Status update failed:", data);
        throw new Error(data.message || "Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Error",
        description: "Could not update appointment status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper functions for status styling
  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
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

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case "PENDING":
        return <AlertCircle className="h-4 w-4" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: AppointmentStatus) => {
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // If not authenticated, redirect handled by useEffect

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
        <p className="text-muted-foreground">
          Manage your upcoming and past appointments.
        </p>
      </div>

      <div className="space-y-4">
        {/* Filters and search */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-1 items-center space-x-2">
            <Filter className="h-4 w-4" />
            <Select
              value={statusFilter}
              onValueChange={(value: string) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Appointments</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search by client or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        {/* Appointments table */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No appointments found.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={appointment.user.image || ""}
                                alt={appointment.user.name || ""}
                              />
                              <AvatarFallback>
                                {appointment.user.name
                                  ?.substring(0, 2)
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {appointment.user.name || "Unknown"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {appointment.user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(
                                new Date(appointment.datetime),
                                "MMM dd, yyyy"
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(appointment.datetime), "h:mm a")}{" "}
                              • {appointment.duration} min
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          ${appointment.totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(appointment.status)}
                          >
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(appointment.status)}
                              <span>{getStatusText(appointment.status)}</span>
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAppointmentDetail(appointment)}
                            >
                              Details
                            </Button>
                            {appointment.status === "PENDING" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                                onClick={() =>
                                  quickUpdateStatus(appointment, "CONFIRMED")
                                }
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Confirm
                              </Button>
                            )}
                            {appointment.status === "CONFIRMED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                                onClick={() =>
                                  quickUpdateStatus(appointment, "COMPLETED")
                                }
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Complete
                              </Button>
                            )}
                            {(appointment.status === "PENDING" ||
                              appointment.status === "CONFIRMED") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                                onClick={() =>
                                  quickUpdateStatus(appointment, "CANCELLED")
                                }
                              >
                                <X className="mr-1 h-4 w-4" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium">
                      {appointments.length > 0
                        ? (pagination.page - 1) * pagination.pageSize + 1
                        : 0}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.pageSize,
                        pagination.total
                      )}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span>{" "}
                    results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.pages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View and update appointment information.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Client
                </span>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={selectedAppointment.user.image || ""}
                      alt={selectedAppointment.user.name || ""}
                    />
                    <AvatarFallback>
                      {selectedAppointment.user.name
                        ?.substring(0, 2)
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {selectedAppointment.user.name || "Unknown"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Price
                  </span>
                  <p>${selectedAppointment.totalPrice.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Date
                  </span>
                  <p>
                    {format(
                      new Date(selectedAppointment.datetime),
                      "MMM dd, yyyy"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Time
                  </span>
                  <p>
                    {format(new Date(selectedAppointment.datetime), "h:mm a")}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Duration
                  </span>
                  <p>{selectedAppointment.duration} minutes</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Status
                  </span>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedAppointment.status)}
                  >
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(selectedAppointment.status)}
                      <span>{getStatusText(selectedAppointment.status)}</span>
                    </span>
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Description
                </span>
                <p>
                  {selectedAppointment.description || "No description provided"}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Update Status
                </span>
                <Select
                  value={newStatus}
                  onValueChange={(value: string) =>
                    setNewStatus(value as AppointmentStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Notes
                </span>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes about this appointment"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={updateAppointmentStatus}
              disabled={isUpdating}
              className="ml-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
