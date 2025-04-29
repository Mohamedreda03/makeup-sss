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
  Filter,
  User as UserIcon,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Check,
  X,
  AlertCircle,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Wallet,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

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

// Extending appointment interface to include profit calculation
interface AppointmentWithProfit extends Appointment {
  profit?: number;
}

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalCustomers: number;
  availableBalance: number;
}

export default function ArtistDashboard() {
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

  // State for dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalCustomers: 0,
    availableBalance: 0,
  });

  const [artistAccount, setArtistAccount] = useState<{
    totalEarnings: number;
    pendingPayouts: number;
    availableBalance: number;
    currency: string;
  } | null>(null);
  const [transactions, setTransactions] = useState<
    {
      id: string;
      amount: number;
      type: string;
      status: string;
      createdAt: string;
      description: string | null;
    }[]
  >([]);

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
          throw new Error(data.message || "Failed to fetch appointments");
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast({
          title: "Error",
          description: "Could not load appointments. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user && status === "authenticated") {
      fetchAppointments();
    }
  }, [
    session,
    status,
    statusFilter,
    pagination.page,
    pagination.pageSize,
    selectedDate,
  ]);

  // Fetch artist account
  useEffect(() => {
    if (session?.user && status === "authenticated") {
      fetchArtistAccount();
    }
  }, [session, status]);

  // Calculate dashboard stats
  useEffect(() => {
    if (!appointments.length) return;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const pendingCount = appointments.filter(
      (a) => a.status === "PENDING"
    ).length;
    const confirmedCount = appointments.filter(
      (a) => a.status === "CONFIRMED"
    ).length;
    const completedCount = appointments.filter(
      (a) => a.status === "COMPLETED"
    ).length;
    const cancelledCount = appointments.filter(
      (a) => a.status === "CANCELLED"
    ).length;

    // Count unique customers
    const uniqueCustomerIds = new Set(appointments.map((a) => a.userId));
    const customerCount = uniqueCustomerIds.size;

    setStats({
      totalAppointments: appointments.length,
      pendingAppointments: pendingCount,
      confirmedAppointments: confirmedCount,
      completedAppointments: completedCount,
      cancelledAppointments: cancelledCount,
      totalCustomers: customerCount,
      availableBalance: artistAccount?.availableBalance || 0,
    });
  }, [appointments, artistAccount]);

  const fetchArtistAccount = async () => {
    try {
      const response = await fetch("/api/artist/account");
      if (response.ok) {
        const data = await response.json();
        setArtistAccount(data.account);
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching artist account:", error);
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async () => {
    if (!selectedAppointment) return;

    try {
      setIsUpdating(true);
      const response = await fetch(
        `/api/appointments/${selectedAppointment.id}/status`,
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
          description: `Appointment status updated to ${getStatusText(
            newStatus
          )}`,
          variant: "success",
        });

        // Update local state
        setAppointments(
          appointments.map((appointment) =>
            appointment.id === selectedAppointment.id
              ? {
                  ...appointment,
                  status: newStatus,
                  notes: statusNotes || appointment.notes,
                }
              : appointment
          )
        );

        setIsModalOpen(false);
      } else {
        throw new Error(data.message || "Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Error",
        description: "Could not update appointment status. Please try again.",
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
        setAppointments(
          appointments.map((a) =>
            a.id === appointment.id ? { ...a, status: newStatus } : a
          )
        );

        // Refresh appointments list after status update
        if (session?.user && status === "authenticated") {
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
        }
      } else {
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

  // Helper functions
  const getStatusColor = (status: AppointmentStatus) => {
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

  const getStatusIcon = (status: AppointmentStatus) => {
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
      <h1 className="text-3xl font-bold mb-6">Artist Dashboard</h1>

      {/* Main Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">Total Appointments</h3>
                <p className="text-3xl font-bold">{stats.totalAppointments}</p>
                <div className="flex mt-2 space-x-2 text-xs">
                  <span className="flex items-center text-amber-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {stats.pendingAppointments} Pending
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

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">Available Balance</h3>
                <p className="text-3xl font-bold">
                  ${stats.availableBalance.toFixed(2)}
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Ready for withdrawal
                </p>
              </div>
              <Wallet className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsContent value="appointments" className="space-y-4">
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
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                Manage your upcoming and past appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={appointment.user.image || undefined}
                                alt={appointment.user.name || "Client"}
                              />
                              <AvatarFallback>
                                {appointment.user.name?.[0] || "C"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {appointment.user.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.user.phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {format(
                              new Date(appointment.datetime),
                              "MMM d, yyyy"
                            )}
                            <div className="text-xs text-gray-500">
                              {format(new Date(appointment.datetime), "h:mm a")}{" "}
                              • {appointment.duration} min
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`flex items-center w-fit ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusIcon(appointment.status)}
                            {getStatusText(appointment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {appointment.status === "PENDING" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                                  onClick={() =>
                                    quickUpdateStatus(appointment, "CONFIRMED")
                                  }
                                  title="Confirm Appointment"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                  onClick={() =>
                                    quickUpdateStatus(appointment, "CANCELLED")
                                  }
                                  title="Cancel Appointment"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {appointment.status === "CONFIRMED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                                onClick={() =>
                                  quickUpdateStatus(appointment, "COMPLETED")
                                }
                                title="Mark as Completed"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAppointmentDetail(appointment)}
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
                  No appointments found for the selected filters
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                Showing {appointments.length} of {pagination.total} appointments
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
        </TabsContent>
      </Tabs>

      {/* Appointment Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View and manage appointment details
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Service</div>
                  <div>{selectedAppointment.serviceType}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Price</div>
                  <div>${selectedAppointment.totalPrice.toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Date & Time</div>
                  <div>
                    {format(new Date(selectedAppointment.datetime), "PPP")}
                    <div className="text-sm text-gray-500">
                      {format(new Date(selectedAppointment.datetime), "p")}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Duration</div>
                  <div>{selectedAppointment.duration} minutes</div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">
                  Client Information
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span>{selectedAppointment.user.name}</span>
                  </div>
                  {selectedAppointment.user.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedAppointment.user.email}</span>
                    </div>
                  )}
                  {selectedAppointment.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedAppointment.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">Notes</div>
                <p className="text-sm text-gray-700">
                  {selectedAppointment.notes || "No notes provided"}
                </p>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">Update Status</div>
                <Select
                  value={newStatus}
                  onValueChange={(value: AppointmentStatus) =>
                    setNewStatus(value)
                  }
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
            <Button onClick={updateAppointmentStatus} disabled={isUpdating}>
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
