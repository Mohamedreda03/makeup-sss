"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  color?: "amber" | "gold" | "rose";
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  color = "amber",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating);

  // Update component when external rating prop changes
  useEffect(() => {
    setSelectedRating(rating);
  }, [rating]);

  // Determine size in pixels based on the size prop
  const sizeInPixels = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  // Determine color scheme based on the color prop
  const colorClasses = {
    amber: {
      filled: "text-amber-400 fill-amber-400",
      empty: "text-gray-300",
      hover: "text-amber-300 fill-amber-300",
    },
    gold: {
      filled: "text-yellow-500 fill-yellow-500",
      empty: "text-gray-300",
      hover: "text-yellow-400 fill-yellow-400",
    },
    rose: {
      filled: "text-rose-500 fill-rose-500",
      empty: "text-gray-300",
      hover: "text-rose-400 fill-rose-400",
    },
  }[color];

  const handleClick = (value: number) => {
    if (!interactive) return;

    setSelectedRating(value);
    onChange?.(value);
  };

  return (
    <div
      className={cn("flex", className)}
      onMouseLeave={() => interactive && setHoveredRating(0)}
    >
      {Array.from({ length: maxRating }).map((_, index) => {
        const value = index + 1;
        const isFilled = interactive
          ? (hoveredRating || selectedRating) >= value
          : selectedRating >= value;

        return (
          <Star
            key={index}
            size={sizeInPixels}
            className={cn(
              "transition-colors mr-0.5",
              isFilled
                ? colorClasses.filled
                : hoveredRating >= value
                ? colorClasses.hover
                : colorClasses.empty,
              interactive && "cursor-pointer"
            )}
            onClick={() => handleClick(value)}
            onMouseEnter={() => interactive && setHoveredRating(value)}
          />
        );
      })}
    </div>
  );
}
