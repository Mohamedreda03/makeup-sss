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
  Clock,
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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";

// Extend dayjs with necessary plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("en"); // Set English locale

// Force dynamic rendering to prevent build-time database queries
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await checkAdmin();
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
      icon: <Package className="h-8 w-8 text-white" />,
      bgGradient: "from-purple-600 via-pink-600 to-red-600",
      iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
      textColor: "text-white",
      subText: "Active products in inventory",
    },
    {
      title: "Total Customers",
      value: usersCount,
      icon: <Users className="h-8 w-8 text-white" />,
      bgGradient: "from-blue-600 via-cyan-600 to-teal-600",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      textColor: "text-white",
      subText: "Registered customers",
    },
    {
      title: "Artists",
      value: artistsCount,
      icon: <UserCog className="h-8 w-8 text-white" />,
      bgGradient: "from-orange-600 via-yellow-600 to-amber-600",
      iconBg: "bg-gradient-to-br from-orange-500 to-yellow-500",
      textColor: "text-white",
      subText: "Professional makeup artists",
    },
    {
      title: "Appointments",
      value: appointmentsCount,
      icon: <Calendar className="h-8 w-8 text-white" />,
      bgGradient: "from-emerald-600 via-green-600 to-lime-600",
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-500",
      textColor: "text-white",
      subText: "Total bookings made",
    },
  ];

  return (
    <div>
      {" "}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-lg">
            Manage your makeup studio with ease
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">Welcome back</p>
          <p className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {user.name}
          </p>
        </div>
      </div>{" "}
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={`bg-gradient-to-br ${stat.bgGradient} border-none shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden relative group`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
              <div>
                <CardTitle
                  className={`text-sm font-medium ${stat.textColor} opacity-90 mb-1`}
                >
                  {stat.title}
                </CardTitle>
                <p className={`text-xs ${stat.textColor} opacity-70`}>
                  {stat.subText}
                </p>
              </div>
              <div className={`${stat.iconBg} p-3 rounded-xl shadow-lg`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className={`text-4xl font-bold ${stat.textColor} mb-2`}>
                {stat.value.toLocaleString()}
              </div>
              <div
                className={`text-xs ${stat.textColor} opacity-75 flex items-center`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>Active</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>{" "}
      {/* Recent Orders Section */}{" "}
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
        <ShoppingBag className="mr-3 h-6 w-6 text-gray-700" />
        Recent Orders
      </h2>
      <Card className="mb-12 shadow-lg overflow-hidden border border-gray-200 bg-white">
        <CardHeader className="bg-gray-50 border-b border-gray-200 pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Recent Orders
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Latest customer orders and transactions
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Order ID
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Customer
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Status
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Amount
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {" "}
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-xl font-medium text-gray-700">
                        No orders found
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        No order data available at the moment
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                ordersWithTotals.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium py-4 px-6">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-black hover:text-gray-600 hover:underline transition-colors font-mono text-sm"
                      >
                        {order.id.substring(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-gray-700 font-medium">
                      {order.user?.name || "Guest"}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge
                        className="font-medium"
                        variant={
                          order.status === "COMPLETED"
                            ? "default"
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
                    <TableCell className="py-4 px-6 font-bold text-black">
                      EGP {order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm py-4 px-6 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {dayjs(order.createdAt)
                        .tz("Africa/Cairo")
                        .locale("en")
                        .fromNow()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>{" "}
        <CardFooter className="border-t border-gray-200 bg-gray-50 flex justify-end py-4">
          <Button
            variant="ghost"
            asChild
            className="text-sm text-gray-700 hover:text-black hover:bg-gray-200 font-medium"
          >
            <Link href="/admin/orders" className="flex items-center">
              View All Orders <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      </Card>{" "}
      {/* Recent Products Section */}{" "}
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
        <Package className="mr-3 h-6 w-6 text-gray-700" />
        Recent Products
      </h2>
      <Card className="mb-12 shadow-lg overflow-hidden border border-gray-200 bg-white">
        <CardHeader className="bg-gray-50 border-b border-gray-200 pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Recent Products
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Recently added makeup products and cosmetics
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Product Name
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Price
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Category
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Stock
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Date Added
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {" "}
              {recentProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Package className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-xl font-medium text-gray-700">
                        No products found
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        No product data available at the moment
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium py-4 px-6">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-black hover:text-gray-600 hover:underline transition-colors"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 px-6 font-bold text-black">
                      EGP {product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-gray-700">
                      {product.category}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge
                        className="font-medium"
                        variant={
                          product.stock_quantity > 10
                            ? "default"
                            : product.stock_quantity > 0
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {product.stock_quantity > 0
                          ? `${product.stock_quantity} in stock`
                          : "Out of stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm py-4 px-6 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {dayjs(product.createdAt)
                        .tz("Africa/Cairo")
                        .locale("en")
                        .fromNow()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>{" "}
        <CardFooter className="border-t border-gray-200 bg-gray-50 flex justify-end py-4">
          <Button
            variant="ghost"
            asChild
            className="text-sm text-gray-700 hover:text-black hover:bg-gray-200 font-medium"
          >
            <Link href="/admin/products" className="flex items-center">
              View All Products <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      </Card>{" "}
      {/* Recent Appointments Section */}{" "}
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
        <Calendar className="mr-3 h-6 w-6 text-gray-700" />
        Recent Appointments
      </h2>
      <Card className="mb-12 shadow-lg overflow-hidden border border-gray-200 bg-white">
        <CardHeader className="bg-gray-50 border-b border-gray-200 pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Recent Appointments
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Latest makeup artist bookings and sessions
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Customer
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Artist
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Service
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Date & Time
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Status
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-700 py-4 px-6">
                  Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {" "}
              {recentAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-xl font-medium text-gray-700">
                        No appointments found
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        No appointment data available at the moment
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentAppointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium py-4 px-6 text-gray-700">
                      {appointment.user?.name || "Guest"}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-gray-700">
                      {appointment.artist?.user?.name || "Unknown Artist"}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-gray-700">
                      {appointment.service_type}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm py-4 px-6">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {dayjs(appointment.date_time)
                            .tz("Africa/Cairo")
                            .locale("en")
                            .format("D MMM YYYY")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>
                          {dayjs(appointment.date_time)
                            .tz("Africa/Cairo")
                            .locale("en")
                            .format("h:mm A")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge
                        className="font-medium"
                        variant={
                          appointment.booking_status === "COMPLETED"
                            ? "default"
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
                    <TableCell className="py-4 px-6 font-bold text-black">
                      {appointment.total_price
                        ? `EGP ${appointment.total_price.toFixed(2)}`
                        : "Not available"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>{" "}
        <CardFooter className="border-t border-gray-200 bg-gray-50 flex justify-end py-4">
          <Button
            variant="ghost"
            asChild
            className="text-sm text-gray-700 hover:text-black hover:bg-gray-200 font-medium"
          >
            <Link href="/admin/bookings" className="flex items-center">
              View All Appointments <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
