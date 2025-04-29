"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Fixed categories from the requirements
const MAKEUP_CATEGORIES = [
  { value: "bridal", label: "Bridal Makeup" },
  { value: "party", label: "Party Makeup" },
  { value: "editorial", label: "Editorial & Photoshoot" },
  { value: "henna", label: "Henna Night & Engagement" },
  { value: "reception", label: "Bridal & Reception" },
  { value: "photoshoot", label: "Photoshoot Makeup" },
  { value: "runway", label: "Runway & Fashion Show" },
];

interface CategorySelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {MAKEUP_CATEGORIES.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Export the categories for reuse
export const ARTIST_CATEGORIES = MAKEUP_CATEGORIES;
