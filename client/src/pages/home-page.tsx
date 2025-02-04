import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { FoodLog } from "@/components/food-log";
import { NutritionalChart } from "@/components/nutritional-chart";
import { useQuery } from "@tanstack/react-query";
import type { SelectFoodLog } from "@db/schema";

export default function HomePage() {
  const { data: foodLogs } = useQuery<SelectFoodLog[]>({ 
    queryKey: ["/api/food-logs"]
  });

  const today = new Date().toLocaleDateString();
  const todaysCalories = foodLogs
    ?.filter(log => new Date(log.createdAt).toLocaleDateString() === today)
    ?.reduce((sum, log) => sum + log.calories, 0) ?? 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calorie Tracker</h1>
        <Link href="/food-entry">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Food
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Progress</CardTitle>
          </CardHeader>
          <NutritionalChart foodLogs={foodLogs ?? []} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Meals</CardTitle>
          </CardHeader>
          <FoodLog foodLogs={foodLogs ?? []} />
        </Card>
      </div>
    </div>
  );
}
