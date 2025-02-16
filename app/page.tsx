import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { meals } from "@/lib/db/schema";
import { AddFoodButton } from "@/components/add-food-button"; // We'll create this
import { FoodLog } from "@/components/food-log";
import { NutritionalChart } from "@/components/nutritional-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "./lib/auth";
import { GroupedLogs } from "@/components/food-log";
import { ClientToast } from "./components/client-toast";
import { getCookie } from "./actions";

export default async function HomePage() {
  const user = await getAuthUser()
  const flashMessage = await getCookie('flash-message')
  
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
      timeZone: meal.timeZone,
      logs: meal.foodLogs.map(log => ({
        ...log,
        meal: {
          id: meal.id,
          name: meal.name,
        }
      }))
    };
    return acc;
  }, {});

  const today = new Date().setHours(0, 0, 0, 0);
  console.log({today})
  const todaysFoodLogs = Object.values(groupedLogs)
  .filter(meal => {
    const mealDate = new Date(meal.createdAt);
    mealDate.setHours(0, 0, 0, 0);
    console.log('mealDate.getTime() ', mealDate.getTime())
    return mealDate.getTime() === today;
  })
  .flatMap(meal => meal.logs);

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
          <NutritionalChart foodLogs={[]} dailyCalorieGoal={user.dailyCalorieGoal} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Meals</CardTitle>
          </CardHeader>
          <FoodLog foodLogs={groupedLogs} />
        </Card>
      </div>
    </div>
    </>
  );
}
