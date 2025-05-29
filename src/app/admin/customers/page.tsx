import { Suspense } from "react";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { db } from "@/lib/db";
import { User, UserRole } from "@/generated/prisma";
import { formatDistanceToNow } from "date-fns";
import { UserObjectAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Force dynamic rendering to prevent build-time database queries
export const dynamic = 'force-dynamic';
import {
  Users,
  ShoppingBag,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Customers | Admin Dashboard",
  description: "Manage customers and view their information",
};

// Loading skeleton for customers table
function CustomersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-4 w-28" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Interface for customers with extended data
interface CustomerWithStats extends User {
  orders: any[];
  bookings: any[];
  reviews: any[];
  _count: {
    orders: number;
    bookings: number;
    reviews: number;
  };
  totalSpent: number;
}

// Main customers list component
async function CustomersList({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) {
  // Calculate skip value for pagination
  const skip = (page - 1) * pageSize;

  // Get total count of customers
  const totalCustomers = await db.user.count({
    where: {
      role: UserRole.CUSTOMER,
    },
  });

  // Fetch customers with pagination
  const customers = await db.user.findMany({
    where: {
      role: UserRole.CUSTOMER,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: pageSize,
    include: {
      orders: {
        select: {
          id: true,
          order_date: true,
          status: true,
          order_details: {
            select: {
              price: true,
              quantity: true,
            },
          },
        },
      },
      bookings: {
        select: {
          id: true,
          date_time: true,
          booking_status: true,
          service_price: true,
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          date: true,
        },
      },
      _count: {
        select: {
          orders: true,
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  // Calculate statistics for each customer
  const customersWithStats = customers.map((customer) => {
    // Calculate total spent from orders
    const totalFromOrders = customer.orders.reduce((total, order) => {
      const orderTotal = order.order_details.reduce((orderSum, detail) => {
        return orderSum + detail.price * detail.quantity;
      }, 0);
      return total + orderTotal;
    }, 0);

    // Calculate total spent from bookings
    const totalFromBookings = customer.bookings.reduce((total, booking) => {
      return total + (booking.service_price || 0);
    }, 0);

    return {
      ...customer,
      totalSpent: totalFromOrders + totalFromBookings,
    };
  }); // Calculate summary statistics
  const totalPages = Math.ceil(totalCustomers / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCustomers);

  return (
    <div className="space-y-6">
      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory ({totalCustomers} customers)</CardTitle>
          <CardDescription>
            Comprehensive view of all registered customers and their activity
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              {" "}
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-64">Customer</TableHead>
                  <TableHead className="text-center">Email</TableHead>
                  <TableHead className="text-center">Contact</TableHead>
                  <TableHead className="text-center">Activity</TableHead>
                  <TableHead className="text-center">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersWithStats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-gray-300" />
                        <p>No customers found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  customersWithStats.map((customer: CustomerWithStats) => {
                    return (
                      <TableRow key={customer.id} className="hover:bg-gray-50">
                        {" "}
                        {/* Customer Info */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <UserObjectAvatar
                              user={customer}
                              className="h-12 w-12"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 truncate">
                                  {customer.name || "No name"}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  Customer
                                </Badge>
                              </div>
                              {customer.phone && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                              {customer.address && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-48">
                                    {customer.address}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {/* Email */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-900 truncate max-w-48">
                              {customer.email}
                            </span>
                          </div>
                        </TableCell>
                        {/* Contact Status */}
                        <TableCell className="text-center">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={customer.phone ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {customer.phone ? "Phone ✓" : "No Phone"}
                            </Badge>
                            <Badge
                              variant={
                                customer.address ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {customer.address ? "Address ✓" : "No Address"}
                            </Badge>
                          </div>
                        </TableCell>{" "}
                        {/* Activity */}
                        <TableCell className="text-center">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-1">
                              <ShoppingBag className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                {customer._count.orders}
                              </span>
                              <span className="text-xs text-gray-500">
                                orders
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">
                                {customer._count.bookings}
                              </span>
                              <span className="text-xs text-gray-500">
                                bookings
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        {/* Joined Date */}
                        <TableCell className="text-center">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm">
                              {customer.createdAt
                                ? formatDistanceToNow(
                                    new Date(customer.createdAt),
                                    {
                                      addSuffix: true,
                                    }
                                  )
                                : "Unknown"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {customer.createdAt
                                ? new Date(
                                    customer.createdAt
                                  ).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {endIndex} of {totalCustomers} customers
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/customers?page=${page - 1}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Link>
              </Button>
            )}

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    className={`min-w-[32px] ${
                      pageNum === page
                        ? "bg-rose-600 hover:bg-rose-700 border-rose-600"
                        : "border-gray-300 hover:border-rose-300 hover:text-rose-600"
                    }`}
                    asChild
                  >
                    <Link href={`/admin/customers?page=${pageNum}`}>
                      {pageNum}
                    </Link>
                  </Button>
                );
              })}
            </div>

            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/customers?page=${page + 1}`}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
  };
}) {
  // Check if user is admin
  await checkAdmin();

  // Parse pagination parameters
  const pageParam = searchParams?.page;
  const rawPage = pageParam ? parseInt(pageParam) : 1;
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = 10; // Number of customers per page

  return (
    <Suspense fallback={<CustomersTableSkeleton />}>
      <CustomersList page={page} pageSize={pageSize} />
    </Suspense>
  );
}
