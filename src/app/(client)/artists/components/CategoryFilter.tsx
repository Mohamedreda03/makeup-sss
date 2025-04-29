"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
}

export function CategoryFilter({
  categories,
  selectedCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/artists${
            category.id === "all" ? "" : `?category=${category.id}`
          }`}
          className={`px-4 py-2 text-left rounded-md transition-all ${
            selectedCategory === category.id
              ? "bg-rose-100 text-rose-600"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
