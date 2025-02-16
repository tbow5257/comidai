import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SelectFoodLog } from "@/lib/db/schema";

export function NutritionalChart({foodLogs, dailyCalorieGoal }: { dailyCalorieGoal?: number | null, foodLogs: SelectFoodLog[] }) {
  const today = new Date().toLocaleDateString();
  const todaysLogs = foodLogs.filter(
    log => new Date(log.createdAt).toLocaleDateString() === today
  );

  const calories = todaysLogs.reduce((sum, log) => sum + log.calories, 0);
  const protein = todaysLogs.reduce((sum, log) => sum + Number(log.protein), 0);

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