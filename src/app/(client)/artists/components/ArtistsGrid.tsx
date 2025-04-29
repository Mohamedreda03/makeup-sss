import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getCategoryName } from "../utils";

interface Artist {
  id: string;
  name: string | null;
  image: string | null;
  category: string;
  completedAppointments: number;
  isAvailable: boolean;
}

interface ArtistsGridProps {
  artists: Artist[];
}

export function ArtistsGrid({ artists }: ArtistsGridProps) {
  if (artists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No artists found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {artists.map((artist) => (
        <Link href={`/artists/${artist.id}`} key={artist.id}>
          <Card className="overflow-hidden border border-gray-200 rounded-lg">
            <div className="relative h-64 bg-gray-50">
              {artist.image ? (
                <Image
                  src={artist.image}
                  alt={artist.name || "Artist"}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="mb-2">
                <Badge
                  variant={artist.isAvailable ? "success" : "destructive"}
                  className="mb-2"
                >
                  {artist.isAvailable ? "Available" : "Not Available"}
                </Badge>
                <h3 className="text-lg font-semibold">{artist.name}</h3>
                <p className="text-sm text-gray-500">
                  {getCategoryName(artist.category)}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
