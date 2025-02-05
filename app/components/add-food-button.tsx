// app/components/add-food-button.tsx
'use client';

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export function AddFoodButton() {
  return (
    <Link href="/food-entry">
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Food
      </Button>
    </Link>
  );
}
