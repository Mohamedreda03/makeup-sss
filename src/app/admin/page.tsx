import { checkAdmin } from "@/lib/utils/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Package,
  Users,
  UserCog,
  Calendar,
  TrendingUp,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";

// Force dynamic rendering to prevent build-time database queries
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = (await checkAdmin()) as any;

  // Get counts for the dashboard
  const productsCount = await db.product.count();
  const usersCount = await db.user.count({
    where: { role: "CUSTOMER" },
  });
  const artistsCount = await db.user.count({
    where: { role: "ARTIST" },
  });

  // Get appointment count
  const appointmentsCount = await db.booking.count();
  // Get recent orders
  const recentOrders = await db.order.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      order_details: {
        select: {
          price: true,
          quantity: true,
        },
      },
    },
  });

  // Calculate total for each order
  const ordersWithTotals = recentOrders.map((order) => ({
    ...order,
    total: order.order_details.reduce(
      (sum, detail) => sum + detail.price * detail.quantity,
      0
    ),
  }));
  // Get recent products
  const recentProducts = await db.product.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      price: true,
      category: true,
      stock_quantity: true,
      createdAt: true,
    },
  });

  const recentAppointments = await db.booking.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      artist: {
        select: {
          id: true,

          user: {
            select: {
              name: true,
              image: true,
            },
          },
          pricing: true,
          rating: true,
        },
      },
    },
  });

  const stats = [
    {
      title: "Total Products",
      value: productsCount,
      icon: <Package className="h-6 w-6 text-rose-600" />,
    },
    {
      title: "Total Customers",
      value: usersCount,
      icon: <Users className="h-6 w-6 text-indigo-600" />,
    },
    {
      title: "Artists",
      value: artistsCount,
      icon: <UserCog className="h-6 w-6 text-amber-600" />,
    },
    {
      title: "Appointments",
      value: appointmentsCount,
      icon: <Calendar className="h-6 w-6 text-green-600" />,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, <span className="font-semibold">{user.name}</span>
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders Section */}
      <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
      <Card className="mb-8 shadow-sm">
        <CardHeader className="bg-white border-b pb-3">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Order ID</TableHead>
                <TableHead className="font-medium">Customer</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Amount</TableHead>
                <TableHead className="font-medium">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {" "}
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                ordersWithTotals.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.id.substring(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell>{order.user?.name || "Guest"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "COMPLETED"
                            ? "success"
                            : order.status === "PENDING"
                            ? "outline"
                            : order.status === "CANCELLED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>EGP {order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>{" "}
        <CardFooter className="border-t flex justify-end py-2">
          <Button variant="ghost" asChild className="text-sm">
            <Link href="/admin/orders" className="flex items-center">
              View all orders <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Recent Products Section */}
      <h2 className="text-xl font-bold mb-4">Recent Products</h2>
      <Card className="mb-8 shadow-sm">
        <CardHeader className="bg-white border-b pb-3">
          <CardTitle className="text-lg">Recent Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {" "}
                <TableHead className="font-medium">Product Name</TableHead>
                <TableHead className="font-medium">Price</TableHead>
                <TableHead className="font-medium">Category</TableHead>
                <TableHead className="font-medium">Stock</TableHead>
                <TableHead className="font-medium">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {" "}
              {recentProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                recentProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>{" "}
                    <TableCell>EGP {product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.stock_quantity > 0 ? "default" : "destructive"
                        }
                      >
                        {product.stock_quantity > 0
                          ? `${product.stock_quantity} in stock`
                          : "Out of stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {formatDistanceToNow(new Date(product.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>{" "}
        <CardFooter className="border-t flex justify-end py-2">
          <Button variant="ghost" asChild className="text-sm">
            <Link href="/admin/products" className="flex items-center">
              View all products <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Recent Appointments Section */}
      <h2 className="text-xl font-bold mb-4">Recent Appointments</h2>
      <Card className="mb-8 shadow-sm">
        <CardHeader className="bg-white border-b pb-3">
          <CardTitle className="text-lg">Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Customer</TableHead>
                <TableHead className="font-medium">Artist</TableHead>
                <TableHead className="font-medium">Service</TableHead>
                <TableHead className="font-medium">Date & Time</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                recentAppointments.map((appointment) => (
                  <TableRow key={appointment.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {appointment.user?.name || "Guest"}
                    </TableCell>
                    <TableCell>
                      {appointment.artist?.user?.name || "Unknown Artist"}
                    </TableCell>
                    <TableCell>{appointment.service_type}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(appointment.date_time), "MMM dd, yyyy")}
                      <br />
                      <span className="text-xs">
                        {format(new Date(appointment.date_time), "HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          appointment.booking_status === "COMPLETED"
                            ? "success"
                            : appointment.booking_status === "CONFIRMED"
                            ? "default"
                            : appointment.booking_status === "PENDING"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {appointment.booking_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appointment.service_price
                        ? `EGP ${appointment.service_price.toFixed(2)}`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>{" "}
        <CardFooter className="border-t flex justify-end py-2">
          <Button variant="ghost" asChild className="text-sm">
            <Link href="/admin/bookings" className="flex items-center">
              View all appointments <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
