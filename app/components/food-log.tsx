import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { type SelectFoodLog } from "@/lib/db/schema";

export type GroupedLogs = {
  [mealId: number]: { // Changed from string to number to match schema
    mealName: string;
    createdAt: Date;
    logs: (SelectFoodLog & {
      meal: {
        id: number;
        name: string;
        createdAt: Date;
      }
    })[];
  }
}

interface FoodLogProps {
  foodLogs: GroupedLogs
}

export function FoodLog({ foodLogs }: FoodLogProps) {
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-8">
        {Object.entries(foodLogs).map(([mealId, meal]) => (
          <div key={mealId} className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{meal.mealName}</h3>
              <span className="text-sm text-muted-foreground">
                {format(new Date(meal.createdAt), "MMM d, h:mm a")}
              </span>
            </div>
            <div className="space-y-2">
              {meal.logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">{log.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {log.portionSize} {log.portionUnit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{log.calories} cal</p>
                    <p className="text-sm text-muted-foreground">
                      Protein: {log.protein}g
                    </p>
                  </div>
                </div>
              ))}
              <div className="text-sm font-medium text-right pr-4">
                Total: {meal.logs.reduce((sum, log) => sum + log.calories, 0)} cal
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
