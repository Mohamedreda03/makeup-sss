import { checkAdmin } from "@/lib/utils/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  MapPin,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";

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
  const appointmentsCount = await db.appointment.count();

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
    },
  });

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
      createdAt: true,
    },
  });

  // Get recent appointments
  const recentAppointments = await db.appointment.findMany({
    take: 5,
    orderBy: {
      datetime: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      artist: {
        select: {
          name: true,
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

  const quickLinks = [
    {
      title: "Add New Product",
      description: "Create a new product listing",
      icon: <ShoppingBag className="h-6 w-6 text-rose-600" />,
      href: "/admin/products/new",
    },
    {
      title: "Manage Artists",
      description: "View and manage artist profiles",
      icon: <UserCog className="h-6 w-6 text-rose-600" />,
      href: "/admin/artists",
    },
    {
      title: "View Analytics",
      description: "See detailed performance metrics",
      icon: <TrendingUp className="h-6 w-6 text-rose-600" />,
      href: "/admin/analytics",
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
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
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
                    <TableCell>${order.total.toFixed(2)}</TableCell>
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
        </CardContent>
        <CardFooter className="border-t flex justify-end py-2">
          <Button variant="ghost" asChild className="text-sm">
            <Link href="/admin/orders">
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
                <TableHead className="font-medium">Product Name</TableHead>
                <TableHead className="font-medium">Price</TableHead>

                <TableHead className="font-medium">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
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
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>

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
        </CardContent>
        <CardFooter className="border-t flex justify-end py-2">
          <Button variant="ghost" asChild className="text-sm">
            <Link href="/admin/products">
              View all products <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
