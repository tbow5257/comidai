import { ScrollArea } from "@/components/ui/scroll-area";
import type { SelectFoodLog } from "@db/schema";

export function FoodLog({ foodLogs }: { foodLogs: SelectFoodLog[] }) {
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {foodLogs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-medium">{log.name}</h3>
              <p className="text-sm text-muted-foreground">{log.portionSize}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{log.calories} cal</p>
              <p className="text-sm text-muted-foreground">
                P: {log.protein}g C: {log.carbs}g F: {log.fat}g
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
