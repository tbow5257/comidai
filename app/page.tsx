// app/page.tsx
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { foodLogs } from "@/lib/db/schema";
import { AddFoodButton } from "@/components/add-food-button"; // We'll create this
import { FoodLog } from "@/components/food-log";
import { NutritionalChart } from "@/components/nutritional-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "./lib/auth";

export default async function HomePage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/auth");
  }

  // Fetch food logs server-side
  const logs = await db
    .select()
    .from(foodLogs)
    .where(eq(foodLogs.userId, user.id))
    .orderBy(foodLogs.createdAt);

  const today = new Date().toLocaleDateString();

  const todaysCalories = logs
    ?.filter(log => new Date(log.createdAt).toLocaleDateString() === today)
    ?.reduce((sum, log) => sum + log.calories, 0) ?? 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calorie Tracker</h1>
        <AddFoodButton />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Progress</CardTitle>
          </CardHeader>
          <NutritionalChart foodLogs={logs} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Meals</CardTitle>
          </CardHeader>
          <FoodLog foodLogs={logs} />
        </Card>
      </div>
    </div>
  );
}
