"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Artist {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  createdAt: string;
  defaultPrice: number | null;
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
  const [artists, setArtists] = useState<Artist[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArtists, setTotalArtists] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query || "");
  const [debouncedQuery, setDebouncedQuery] = useState(query || "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch artists data
  useEffect(() => {
    async function fetchArtists() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          search: debouncedQuery,
          page: currentPage.toString(),
          limit: pageSize.toString(),
        });

        const response = await fetch(`/api/admin/artists?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch artists");
        }

        const data = await response.json();
        setArtists(data.artists);
        setTotalPages(data.totalPages);
        setTotalArtists(data.totalArtists);
      } catch (error) {
        console.error("Error fetching artists:", error);
        toast({
          title: "Error",
          description: "Failed to load artists data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchArtists();
  }, [debouncedQuery, currentPage, pageSize]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      // Reset to page 1 when searching
      if (searchQuery !== query && currentPage !== 1) {
        router.push(
          `/admin/artists?query=${searchQuery}&page=1&limit=${pageSize}`
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, query, currentPage, pageSize, router]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/admin/artists?query=${searchQuery}&page=1&limit=${pageSize}`);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    router.push(
      `/admin/artists?query=${debouncedQuery}&page=${page}&limit=${pageSize}`
    );
  };

  // Handle artist deletion
  const handleDeleteArtist = async () => {
    if (!artistToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/artists/${artistToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete artist");
      }

      // Remove artist from the list
      setArtists((prev) =>
        prev.filter((artist) => artist.id !== artistToDelete)
      );

      // Show success message
      toast({
        title: "Artist Deleted",
        description: "The artist has been deleted successfully",
        variant: "success",
      });

      // Refresh the page if we deleted the last item on the current page
      if (artists.length === 1 && currentPage > 1) {
        router.push(
          `/admin/artists?query=${debouncedQuery}&page=${
            currentPage - 1
          }&limit=${pageSize}`
        );
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting artist:", error);
      toast({
        title: "Error",
        description: "Failed to delete artist",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setArtistToDelete(null);
    }
  };

  return (
    <div>
      {/* Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full md:w-2/3 flex items-center gap-2"
        >
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Artists Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artist</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  Price (EGP)
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  Created
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading artists...
                </TableCell>
              </TableRow>
            ) : artists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No artists found
                </TableCell>
              </TableRow>
            ) : (
              artists.map((artist) => (
                <TableRow key={artist.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={artist.image || undefined}
                          alt={artist.name || "Artist"}
                        />
                        <AvatarFallback>
                          {artist.name?.[0] || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{artist.name}</div>
                        <div className="text-sm text-gray-500">
                          {artist.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {artist.phone || "No phone number"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {artist.defaultPrice
                        ? `${artist.defaultPrice} EGP`
                        : "Not set"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(artist.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/artists/${artist.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/artists/${artist.id}/edit`)
                            }
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setArtistToDelete(artist.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 0 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-500">
            Showing {artists.length} of {totalArtists} artists
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the artist and all their data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArtist}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
