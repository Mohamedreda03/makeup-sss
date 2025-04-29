"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import { ar } from "date-fns/locale";
import {
  BarChart,
  Loader2,
  CalendarDays,
  Users,
  DollarSign,
  TrendingUp,
  ChevronDown,
  Calendar,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extended user interface for typing session.user
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// Analytics data interfaces
interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  appointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  newClients: number;
}

interface AppointmentStats {
  total: number;
  completed: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completionRate: number;
}

interface AnalyticsData {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  totalRevenue: number;
  totalClients: number;
  newClientsThisMonth: number;
  appointmentStats: AppointmentStats;
  monthlyData: MonthlyData[];
  popularServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

export default function ArtistAnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("last6months");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
    totalRevenue: 0,
    totalClients: 0,
    newClientsThisMonth: 0,
    appointmentStats: {
      total: 0,
      completed: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completionRate: 0,
    },
    monthlyData: [],
    popularServices: [],
  });

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

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session?.user || status !== "authenticated") return;

      try {
        setIsLoading(true);

        // Calculate date range based on timeframe
        let monthsToSubtract = 6;
        if (timeframe === "last12months") monthsToSubtract = 12;
        else if (timeframe === "last3months") monthsToSubtract = 3;
        else if (timeframe === "thisyear")
          monthsToSubtract = new Date().getMonth();

        const endDate = new Date();
        const startDate = subMonths(endDate, monthsToSubtract);

        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const response = await fetch(
          `/api/artist/analytics?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: "Could not load analytics data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user && status === "authenticated") {
      fetchAnalytics();
    }
  }, [session, status, timeframe]);

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Revenue change percentage
  const revenueChange = calculatePercentageChange(
    analyticsData.currentMonthRevenue,
    analyticsData.previousMonthRevenue
  );

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
    router.push("/sign-in?callbackUrl=/artist-dashboard/analytics");
    return null;
  }

  return (
    <div className="container py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-500">
            Insights into your business performance
          </p>
        </div>
        <div className="flex space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="last12months">Last 12 Months</SelectItem>
              <SelectItem value="thisyear">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => router.push("/artist-dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Monthly Revenue
                </h3>
                <p className="text-3xl font-bold">
                  ${analyticsData.currentMonthRevenue.toFixed(2)}
                </p>
                <div
                  className={`flex items-center mt-1 text-sm ${
                    revenueChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <span>
                    {revenueChange >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(revenueChange).toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Total Clients
                </h3>
                <p className="text-3xl font-bold">
                  {analyticsData.totalClients}
                </p>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <span className="text-green-600">
                    +{analyticsData.newClientsThisMonth}
                  </span>
                  <span className="ml-1">this month</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Appointment Rate
                </h3>
                <p className="text-3xl font-bold">
                  {analyticsData.appointmentStats.completionRate.toFixed(0)}%
                </p>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <span>
                    {analyticsData.appointmentStats.completed} completed
                  </span>
                  <span className="mx-1">of</span>
                  <span>{analyticsData.appointmentStats.total} total</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Total Revenue
                </h3>
                <p className="text-3xl font-bold">
                  ${analyticsData.totalRevenue.toFixed(2)}
                </p>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <span>Lifetime earnings</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue trend over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {analyticsData.monthlyData.length > 0 ? (
                <div className="relative h-full">
                  {/* Simple Bar Chart */}
                  <div className="flex h-64 items-end space-x-2">
                    {analyticsData.monthlyData.map((month, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className="w-full bg-rose-400 rounded-t hover:bg-rose-500 transition-all group relative"
                          style={{
                            height: `${
                              (month.revenue /
                                Math.max(
                                  ...analyticsData.monthlyData.map(
                                    (m) => m.revenue
                                  )
                                )) *
                              100
                            }%`,
                            minHeight: month.revenue > 0 ? "10px" : "0",
                          }}
                        >
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            ${month.revenue.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-xs mt-2 text-gray-600 w-full text-center">
                          {format(
                            new Date(month.year, parseInt(month.month) - 1),
                            "MMM"
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* X and Y axis */}
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-200"></div>
                  <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-gray-200"></div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No revenue data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Services</CardTitle>
            <CardDescription>Your most booked services</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.popularServices.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.popularServices.map((service, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-100 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-xs text-gray-500">
                          {service.count} bookings
                        </p>
                      </div>
                    </div>
                    <div className="text-green-600 font-medium">
                      ${service.revenue.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No service data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Statistics</CardTitle>
              <CardDescription>
                Breakdown of your appointment metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold">
                    {analyticsData.appointmentStats.total}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsData.appointmentStats.completed}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData.appointmentStats.confirmed}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analyticsData.appointmentStats.cancelled}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-medium mb-4">
                  Appointment Status Distribution
                </h3>
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                  {analyticsData.appointmentStats.total > 0 && (
                    <>
                      <div
                        className="h-full bg-green-500 float-left"
                        style={{
                          width: `${
                            (analyticsData.appointmentStats.completed /
                              analyticsData.appointmentStats.total) *
                            100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="h-full bg-blue-500 float-left"
                        style={{
                          width: `${
                            (analyticsData.appointmentStats.confirmed /
                              analyticsData.appointmentStats.total) *
                            100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="h-full bg-amber-500 float-left"
                        style={{
                          width: `${
                            (analyticsData.appointmentStats.pending /
                              analyticsData.appointmentStats.total) *
                            100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="h-full bg-red-500 float-left"
                        style={{
                          width: `${
                            (analyticsData.appointmentStats.cancelled /
                              analyticsData.appointmentStats.total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    <span>Confirmed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                    <span>Cancelled</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Metrics</CardTitle>
              <CardDescription>
                Information about your client base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Total Clients
                  </p>
                  <p className="text-2xl font-bold">
                    {analyticsData.totalClients}
                  </p>
                  <p className="text-xs text-gray-500">
                    All-time unique clients
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    New Clients
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData.newClientsThisMonth}
                  </p>
                  <p className="text-xs text-gray-500">New this month</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Average Spend
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    $
                    {analyticsData.totalClients
                      ? (
                          analyticsData.totalRevenue /
                          analyticsData.totalClients
                        ).toFixed(2)
                      : "0.00"}
                  </p>
                  <p className="text-xs text-gray-500">Per client</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-medium mb-4">
                  New Clients Over Time
                </h3>
                <div className="h-40">
                  {analyticsData.monthlyData.length > 0 ? (
                    <div className="flex h-32 items-end space-x-2">
                      {analyticsData.monthlyData.map((month, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center flex-1"
                        >
                          <div
                            className="w-full bg-blue-400 rounded-t hover:bg-blue-500 transition-all group relative"
                            style={{
                              height: `${
                                (month.newClients /
                                  Math.max(
                                    ...analyticsData.monthlyData.map(
                                      (m) => m.newClients || 0
                                    )
                                  )) *
                                100
                              }%`,
                              minHeight: month.newClients > 0 ? "10px" : "0",
                            }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {month.newClients}
                            </div>
                          </div>
                          <div className="text-xs mt-2 text-gray-600 w-full text-center">
                            {format(
                              new Date(month.year, parseInt(month.month) - 1),
                              "MMM"
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No client data available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>
                Detailed analysis of your earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    ${analyticsData.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Lifetime earnings</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Current Month
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ${analyticsData.currentMonthRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">This month so far</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Average Appointment
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    $
                    {analyticsData.appointmentStats.completed
                      ? (
                          analyticsData.totalRevenue /
                          analyticsData.appointmentStats.completed
                        ).toFixed(2)
                      : "0.00"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Per completed appointment
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-medium mb-2">
                  Revenue by Service Type
                </h3>
                <div className="space-y-4 mt-4">
                  {analyticsData.popularServices.map((service, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {service.name}
                        </span>
                        <span className="text-sm font-medium">
                          ${service.revenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-400"
                          style={{
                            width: `${
                              (service.revenue / analyticsData.totalRevenue) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{service.count} appointments</span>
                        <span>
                          {(
                            (service.revenue / analyticsData.totalRevenue) *
                            100
                          ).toFixed(1)}
                          % of total
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
