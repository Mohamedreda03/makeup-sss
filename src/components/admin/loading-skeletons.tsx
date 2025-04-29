import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductsTableSkeleton() {
  return (
    <div>
      {/* Search and Filter Controls Skeleton */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Skeleton className="h-10 flex-1" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </div>

      {/* Products Table Skeleton */}
      <div className="rounded-md border">
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

export function ProductFormSkeleton() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>

      <Skeleton className="h-32" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-10" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-32 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export function ArtistsTableSkeleton() {
  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-2/3 h-10 bg-gray-200 animate-pulse rounded-md" />
        <div className="w-full md:w-1/3 h-10 bg-gray-200 animate-pulse rounded-md" />
      </div>
      <div className="rounded-md border">
        <div className="border-b h-12 bg-gray-100" />
        {Array(5)
          .fill(null)
          .map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div>
                  <div className="w-32 h-5 bg-gray-200 animate-pulse rounded" />
                  <div className="w-24 h-4 mt-1 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
              <div className="w-1/5 h-5 bg-gray-200 animate-pulse rounded" />
              <div className="w-1/6 h-5 bg-gray-200 animate-pulse rounded" />
              <div className="w-16 h-6 bg-gray-200 animate-pulse rounded-full" />
              <div className="w-20 h-6 bg-gray-200 animate-pulse rounded-full" />
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
                <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="w-48 h-5 bg-gray-200 animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="w-24 h-8 bg-gray-200 animate-pulse rounded" />
          <div className="w-24 h-8 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
