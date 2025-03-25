'use client'
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimeDisplay } from "./time-display";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CATEGORY_ICONS } from "app/types/analysis-types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MealsWithLogs } from "app/page";

interface FoodLogProps {
  foodLogs: MealsWithLogs
}

export function FoodLog({ foodLogs }: FoodLogProps) {
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-8">
        {foodLogs.map((meal) => (
          <MealItem key={meal.id} meal={meal} />
        ))}
      </div>
    </ScrollArea>
  );
}

function MealItem({ meal }: { meal: MealsWithLogs[number] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalCalories = meal.foodLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = meal.foodLogs.reduce((sum, log) => Number(log.protein) + sum, 0).toFixed(1);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{meal.name}</h3>
          <div className="flex">
            {meal.categories.map((category) => (
              <span key={category.id} title={category.category} className="text-lg">
                {CATEGORY_ICONS[category.category]}
              </span>
            ))}
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          <TimeDisplay utcTimestamp={meal.createdAt} createdTimeZone={meal.timeZone} />
        </span>
      </div>
      
      {meal.mealSummary && (
        <p className="text-sm text-muted-foreground">{meal.mealSummary}</p>
      )}
      
      <div className="bg-muted rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <span className="font-medium">
              {meal.foodLogs.length} {meal.foodLogs.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="text-right">
            <p className="font-medium">{totalCalories} cal</p>
            <p className="text-sm text-muted-foreground">
              Protein: {totalProtein}g
            </p>
          </div>
        </div>
        
        {isExpanded && (
          <div className="space-y-2 mt-3 pl-6">
            {meal.foodLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-background rounded-md">
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
          </div>
        )}
      </div>
    </div>
  );
}
