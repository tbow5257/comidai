import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SelectFoodLog } from "@db/schema";
import { useAuth } from "@/hooks/use-auth";

export function NutritionalChart({ foodLogs }: { foodLogs: SelectFoodLog[] }) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString();
  const todaysLogs = foodLogs.filter(
    log => new Date(log.createdAt).toLocaleDateString() === today
  );

  const calories = todaysLogs.reduce((sum, log) => sum + log.calories, 0);
  const protein = todaysLogs.reduce((sum, log) => sum + Number(log.protein), 0);
  const carbs = todaysLogs.reduce((sum, log) => sum + Number(log.carbs), 0);
  const fat = todaysLogs.reduce((sum, log) => sum + Number(log.fat), 0);

  const calorieProgress = (calories / (user?.dailyCalorieGoal ?? 2000)) * 100;

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Calories</span>
          <span>{calories} / {user?.dailyCalorieGoal ?? 2000}</span>
        </div>
        <Progress value={calorieProgress} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-lg font-medium">{Math.round(protein)}g</div>
          <div className="text-sm text-muted-foreground">Protein</div>
        </Card>
        <Card className="p-4">
          <div className="text-lg font-medium">{Math.round(carbs)}g</div>
          <div className="text-sm text-muted-foreground">Carbs</div>
        </Card>
        <Card className="p-4">
          <div className="text-lg font-medium">{Math.round(fat)}g</div>
          <div className="text-sm text-muted-foreground">Fat</div>
        </Card>
      </div>
    </div>
  );
}
