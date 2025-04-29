"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface MobileFilterToggleProps {
  children: React.ReactNode;
}

export function MobileFilterToggle({ children }: MobileFilterToggleProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      {/* زر إظهار/إخفاء الفلاتر في الشاشات الصغيرة */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex justify-between items-center"
        >
          <span>Filters</span>
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* محتوى الفلاتر */}
      <div
        className={`md:w-64 flex-shrink-0 ${
          showFilters ? "block" : "hidden"
        } md:block`}
      >
        {children}
      </div>
    </>
  );
}
