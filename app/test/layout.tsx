import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ReactNode } from "react";

export default function TestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center justify-center">
        <div className="flex items-center justify-center flex-1 max-w-200 h-20 gap-4">
          <Link href="/">
            <Button>Home</Button>
          </Link>
          <UserButton />
        </div>
      </header>
      {children}
    </div>
  );
}
