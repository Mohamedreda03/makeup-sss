import { Suspense } from "react";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { db } from "@/lib/db";
import { User, UserRole } from "@/generated/prisma";
import { formatDistanceToNow } from "date-fns";
import { UserObjectAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

// Interface for customers with orders
interface CustomerWithOrders extends User {
  orders: any[];
}

// Main customers list component
async function CustomersList() {
  // Fetch all customers
  const customers = await db.user.findMany({
    where: {
      role: UserRole.CUSTOMER,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      orders: true,
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="text-sm text-gray-500">
          Total: {customers.length} customer{customers.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-gray-500"
                >
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer: CustomerWithOrders) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserObjectAvatar user={customer} className="h-10 w-10" />
                      <div>
                        <div className="font-medium">
                          {customer.name || "No name"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.phone || "No phone"}</TableCell>
                  <TableCell>{customer.orders.length}</TableCell>
                  <TableCell>
                    {customer.createdAt
                      ? formatDistanceToNow(new Date(customer.createdAt), {
                          addSuffix: true,
                        })
                      : "Unknown"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default async function CustomersPage() {
  // Check if user is admin
  await checkAdmin();

  return (
    <Suspense fallback={<CustomersTableSkeleton />}>
      <CustomersList />
    </Suspense>
  );
}
