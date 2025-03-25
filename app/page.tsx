import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { meals } from "@/lib/db/schema";
import { AddFoodButton } from "@/components/add-food-button"; // We'll create this
import { FoodLog } from "@/components/food-log";
import { NutritionalChart } from "@/components/nutritional-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "./lib/auth";
import { ClientToast } from "./components/client-toast";
import { getCookie } from "./actions";

export type MealsWithLogs = Awaited<ReturnType<typeof getMealsWithLogs>>;

// Then extract your query into a function:
async function getMealsWithLogs(userId: number) {
  return await db.query.meals.findMany({
    with: {
      foodLogs: true,
      categories: true
    },
    where: eq(meals.userId, userId),
    orderBy: desc(meals.createdAt),
    limit: 5
  });
}

export default async function HomePage() {
  const user = await getAuthUser()
  const flashMessage = await getCookie('flash-message')
  
  if (!user) {
    redirect("/auth");
  }

  const mealsWithLogs = await getMealsWithLogs(user.id);

  console.log(mealsWithLogs)

  return (
    <>
      {flashMessage && <ClientToast message={flashMessage} />}
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
          <NutritionalChart foodLogs={mealsWithLogs} dailyCalorieGoal={user.dailyCalorieGoal} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Meals</CardTitle>
          </CardHeader>
          <FoodLog foodLogs={mealsWithLogs} />
        </Card>
      </div>
    </div>
    </>
  );
}
