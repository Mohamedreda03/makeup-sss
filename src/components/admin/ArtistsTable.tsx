"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Artist {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  makeup_artist?: {
    pricing: number;
    experience_years: string;
    rating: number;
    bio: string | null;
  } | null;
}

interface ArtistsTableProps {
  query: string;
  currentPage: number;
  pageSize: number;
  sort: string;
}

export default function ArtistsTable({
  query,
  currentPage,
  pageSize,
  sort,
}: ArtistsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(query);
  const [isLoading, setIsLoading] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [totalArtists, setTotalArtists] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeletingModal, setShowDeletingModal] = useState(false);

  // Fetch artists data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort: sort,
      });

      const response = await fetch(`/api/admin/artists?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch artists");
      }

      const data = await response.json();
      setArtists(data.artists || []);
      setTotalArtists(data.totalArtists || 0);
    } catch (error) {
      console.error("Error fetching artists", error);
      toast({
        variant: "destructive",
        title: "Error fetching artists",
        description:
          "There was an error loading the artists. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentPage, pageSize, sort]);

  // Fetch artists when component mounts or when search parameters change
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery !== query) {
      router.push(
        `/admin/artists?query=${encodeURIComponent(
          searchQuery
        )}&page=1&limit=${pageSize}&sort=${sort}`
      );
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }; // Handle sorting
  const handleSortChange = (value: string) => {
    router.push(
      `/admin/artists?query=${encodeURIComponent(
        searchQuery
      )}&page=${currentPage}&limit=${pageSize}&sort=${value}`
    );
  };

  // Handle delete confirmation
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };
  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      setShowDeleteDialog(false); // Close confirmation dialog
      setShowDeletingModal(true); // Show loading modal

      const response = await fetch(`/api/admin/artists/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete artist");
      }

      // Refresh the data from server
      await fetchData();

      toast({
        title: "Artist deleted",
        description: "The artist has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting artist", error);
      toast({
        variant: "destructive",
        title: "Error deleting artist",
        description:
          "There was an error deleting the artist. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeletingModal(false); // Hide loading modal
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  // Calculate pagination values
  const totalPages = Math.ceil(totalArtists / pageSize); // Handle page change
  const handlePageChange = (page: number) => {
    router.push(
      `/admin/artists?query=${encodeURIComponent(
        searchQuery
      )}&page=${page}&limit=${pageSize}&sort=${sort}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 border-gray-300 focus:border-rose-500 focus:ring-rose-500"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              Search
            </Button>
          </form>

          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] border-gray-300 focus:border-rose-500 focus:ring-rose-500">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">Newest first</SelectItem>
              <SelectItem value="createdAt:asc">Oldest first</SelectItem>
              <SelectItem value="name:asc">Name A-Z</SelectItem>
              <SelectItem value="name:desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Artists Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
              <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">
                👩‍🎨
              </span>
            </div>
            Artists Overview ({totalArtists})
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/50 border-b-2 border-rose-200 dark:border-gray-700">
              <TableHead className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                Artist Information
              </TableHead>
              <TableHead className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                Contact Details
              </TableHead>
              <TableHead className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                Pricing & Experience
              </TableHead>
              <TableHead className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                Joined Date
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-900 dark:text-white py-4 px-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {" "}
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-gray-500">Loading artists...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : artists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center shadow-lg">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-gray-500 text-lg font-medium">
                      {searchQuery
                        ? "No artists found matching your search"
                        : "No artists found"}
                    </div>
                    <div className="text-gray-400 text-sm max-w-md">
                      {searchQuery
                        ? "Try adjusting your search terms or clearing the search to see all artists"
                        : "Start by adding your first makeup artist to manage their profiles and services"}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              artists.map((artist) => (
                <TableRow
                  key={artist.id}
                  className="hover:bg-gradient-to-r hover:from-rose-50/50 hover:to-pink-50/50 dark:hover:from-gray-800/50 dark:hover:to-gray-800/30 transition-all duration-200 border-b border-gray-100 dark:border-gray-800"
                >
                  {/* Artist Info */}
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-rose-200 dark:ring-gray-700">
                        <AvatarImage
                          src={artist.image || undefined}
                          alt={artist.name || "Artist"}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 font-medium text-lg">
                          {artist.name?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white text-lg">
                          {artist.name}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          ID: {artist.id.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-gray-400 mt-1 capitalize">
                          Role: {artist.role}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  {/* Contact Info */}
                  <TableCell className="py-4 px-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                          {artist.email}
                        </span>
                      </div>
                      {artist.phone ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <Phone className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {artist.phone}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 opacity-50">
                          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Phone className="h-3 w-3 text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-400">
                            No phone
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {/* Pricing & Experience */}
                  <TableCell className="py-4 px-6">
                    <div className="space-y-3">
                      {/* Pricing */}
                      <div className="flex items-center gap-2">
                        {artist.makeup_artist?.pricing ? (
                          <Badge
                            variant="secondary"
                            className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 font-semibold px-3 py-1"
                          >
                            {artist.makeup_artist.pricing.toLocaleString()} EGP
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-gray-500 bg-gray-50"
                          >
                            Pricing not set
                          </Badge>
                        )}
                      </div>

                      {/* Experience & Rating */}
                      <div className="space-y-1">
                        {artist.makeup_artist?.experience_years && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Experience:</span>{" "}
                            {artist.makeup_artist.experience_years}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {/* Joined Date */}
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>{" "}
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {(() => {
                            try {
                              const date = new Date(artist.createdAt);
                              if (isNaN(date.getTime()))
                                return "Date not available";
                              return format(date, "MMM d, yyyy");
                            } catch {
                              return "Date not available";
                            }
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(() => {
                            try {
                              const date = new Date(artist.createdAt);
                              if (isNaN(date.getTime()))
                                return "Time not available";
                              return format(date, "h:mm a");
                            } catch {
                              return "Time not available";
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </TableCell>{" "}
                  {/* Actions */}
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/artists/${artist.id}`)}
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-9 w-9 p-0 rounded-lg transition-all duration-200 hover:scale-105"
                        title="View Artist Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/artists/${artist.id}/edit`)
                        }
                        className="text-gray-600 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 h-9 w-9 p-0 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Edit Artist"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(artist.id)}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 w-9 p-0 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Delete Artist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>{" "}
      {/* Pagination */}
      {!isLoading && totalPages > 0 && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {artists.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalArtists}
              </span>{" "}
              artists
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 border-gray-300 hover:border-rose-300 hover:text-rose-600"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page =
                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[32px] ${
                        page === currentPage
                          ? "bg-rose-600 hover:bg-rose-700 border-rose-600"
                          : "border-gray-300 hover:border-rose-300 hover:text-rose-600"
                      }`}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 border-gray-300 hover:border-rose-300 hover:text-rose-600"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              artist and remove all their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>{" "}
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Artist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>{" "}
      </AlertDialog>
      {/* Loading Modal for Deletion */}
      <Dialog open={showDeletingModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 px-6">
            <div className="relative mb-6">
              {/* Outer rotating ring */}
              <div className="w-20 h-20 border-4 border-red-200 rounded-full animate-spin border-t-red-600"></div>
              {/* Inner pulsing circle */}
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-pulse bg-red-50 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Deleting Artist
              </h3>
              <p className="text-sm text-gray-600 max-w-sm">
                Please wait while we safely remove the artist and all associated
                data. This may take a few moments...
              </p>

              {/* Progress steps */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">
                    Removing artist profile...
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className="w-2 h-2 bg-red-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <span className="text-gray-600">
                    Cleaning up bookings and reviews...
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className="w-2 h-2 bg-red-300 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                  <span className="text-gray-600">Finalizing deletion...</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
