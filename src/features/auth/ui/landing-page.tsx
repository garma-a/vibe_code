"use client";

import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary">AASTMT</h1>
          <p className="mt-2 text-muted-foreground">
            Room and Lecture Hall Management System
          </p>
        </div>
        
        <div className="space-y-4 pt-4">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
            Login as Staff
          </Button>
          <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary/10" size="lg">
            View Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
