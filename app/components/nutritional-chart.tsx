import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MealsWithLogs } from "app/page";

export function NutritionalChart({foodLogs, dailyCalorieGoal }: { dailyCalorieGoal?: number | null, foodLogs: MealsWithLogs}) {

  const today = new Date().setHours(0, 0, 0, 0);
  
  const todaysFoodLogs = Object.values(foodLogs)
    .filter(meal => {
      const mealDate = new Date(meal.createdAt);
      mealDate.setHours(0, 0, 0, 0);

      return mealDate.getTime() === today;
    })
    .flatMap(meal => meal.foodLogs);

  const calories = todaysFoodLogs?.reduce((sum, log) => sum + log.calories, 0) ?? 0;
  const protein = todaysFoodLogs?.reduce((sum, log) => sum + Number(log.protein), 0) ?? 0;

  const calorieProgress = (calories / (dailyCalorieGoal ?? 2000)) * 100;

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Calories</span>
          <span>{calories} / {dailyCalorieGoal ?? 2000}</span>
        </div>
        <Progress value={calorieProgress} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          <div className="text-lg font-medium">{Math.round(protein)}g</div>
          <div className="text-sm text-muted-foreground">Protein</div>
        </Card>
      </div>
    </div>
  );
}