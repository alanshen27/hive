"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto h-14 px-4 flex items-center justify-between">
        <Link href="/" className="font-semibold">StudyCircle</Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/explore">Explore</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}


