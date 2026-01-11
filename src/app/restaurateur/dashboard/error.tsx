"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Dashboard Error</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Something went wrong loading the dashboard. This could be a temporary issue.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="default">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try again
        </Button>
        <Button onClick={() => window.location.href = "/restaurateur"} variant="outline">
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
