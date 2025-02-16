// app/page.tsx
import { redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { foodLogs, meals } from "@/lib/db/schema";
import { AddFoodButton } from "@/components/add-food-button"; // We'll create this
import { FoodLog } from "@/components/food-log";
import { NutritionalChart } from "@/components/nutritional-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "./lib/auth";
import { GroupedLogs } from "@/components/food-log";

export default async function HomePage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/auth");
  }

  const mealsWithLogs = await db.query.meals.findMany({
    with: {
      foodLogs: true
    },
    where: eq(meals.userId, user.id),
    orderBy: desc(meals.createdAt),
    limit: 5
  });

  const groupedLogs = mealsWithLogs.reduce<GroupedLogs>((acc, meal) => {
    acc[meal.id] = {
      mealName: meal.name,
      createdAt: meal.createdAt,
      logs: meal.foodLogs.map(log => ({
        ...log,
        meal: {
          id: meal.id,
          name: meal.name,
          createdAt: meal.createdAt
        }
      }))
    };
    return acc;
  }, {});

  const today = new Date().toLocaleDateString();
  const todaysFoodLogs = Object.values(groupedLogs)
    .flatMap(meal => meal.logs)
    .filter(log => new Date(log.createdAt).toLocaleDateString() === today);

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
          <NutritionalChart foodLogs={todaysFoodLogs} dailyCalorieGoal={user.dailyCalorieGoal} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Meals</CardTitle>
          </CardHeader>
          <FoodLog foodLogs={groupedLogs} />
        </Card>
      </div>
    </div>
  );
}
