"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

interface RestrictedLinkProps {
  children: React.ReactNode;
  hasAccess: boolean;
  restrictedMessage: string;
  href?: string;
}

export function RestrictedLink({
  children,
  hasAccess,
  restrictedMessage,
  href,
}: RestrictedLinkProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {hasAccess ? (
            <Button
              asChild={!!href}
              variant={hasAccess ? "default" : "outline"}
            >
              {href ? <a href={href}>{children}</a> : children}
            </Button>
          ) : (
            <Button
              disabled
              variant="outline"
              className="opacity-60 cursor-not-allowed"
            >
              {children}
            </Button>
          )}
        </TooltipTrigger>
        {!hasAccess && (
          <TooltipContent>
            <p>{restrictedMessage}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
