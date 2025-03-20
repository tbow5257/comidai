'use client'
import { useState, useTransition } from "react";
import Image from 'next/image'
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CameraUpload } from "@/components/camera-upload";
import { useIsMobile } from "@/hooks/use-mobile"
import type { FoodCategory, FoodProfile } from "../types/analysis-types";
import FoodEntryItem from "./food-entry-item";
import { analyzeFoodImage } from "./analyze-food";
import { createMeal } from "./submit-log-meal";

export default function FoodEntry() {
  const { toast } = useToast();
  const router = useRouter();
  const [foods, setFoods] = useState<FoodProfile[]>([]);
  const [mealSummary, setMealSummary] = useState<string>("");
  const [mealCategories, setMealCategories] = useState<FoodCategory[]>([]);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [originalFoods, setOriginalFoods] = useState<FoodProfile[]>([]);
  const isMobile = useIsMobile();

  const analyzeFood = async (formData: FormData, previewUrl: string) => {
    try {
      setIsAnalyzing(true);
      setImageData(previewUrl);
      
      const data = await analyzeFoodImage(formData);
      setFoods(structuredClone(data.foods));
      if (data.image !== previewUrl) {
        setImageData(data.image);
      }
      setMealSummary(data.meal_summary);
      setMealCategories(data.meal_categories);
      setOriginalFoods(data.foods);
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : 'Analysis failed',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (foods: FoodProfile[]) => {
    startTransition(async () => {
      try {
        const payload = {
          userId: 1,
          name: `Meal ${new Date().toLocaleTimeString()}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          clientTimestamp: new Date().toISOString(),
          mealSummary,
          mealCategories,
          foodLogs: foods.map(food => ({
            name: food.name,
            calories: food.calories,
            protein: food.protein.toString(),
            portionSize: food.estimated_portion.count.toString(),
            portionUnit: food.estimated_portion.unit
          })),
        };
        
        const result = await createMeal(payload);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        toast({ title: "Meal logged successfully!" });
        router.push('/');
      } catch (error) {
        console.error(error);
        toast({
          title: "Failed to log meal",
          description: error instanceof Error ? error.message : 'Failed to save meal',
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Log Your Food</CardTitle>
        </CardHeader>
        <CardContent>
          {!foods.length && (
            <CameraUpload 
              onCapture={analyzeFood}
              analyzing={isAnalyzing}
            />
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center gap-2 my-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing your food...</p>
            </div>
          )}

          {imageData && (
            <div className="mb-6 flex justify-center">
              <div className="relative w-full max-w-[900px] md:w-1/2 aspect-[3/2]">
                <Image 
                  src={imageData}
                  alt="Food analysis"
                  fill
                  className="rounded-lg shadow-lg object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
          )}
          {mealSummary && (
            <div className="mb-6">
              <p className="text-sm font-medium text-center">
                Meal Summary: {mealSummary}
              </p>
            </div>
          )}
          {foods.length > 0 && (
            <>
              {foods.map((food, i) => (
                <FoodEntryItem
                  key={i}
                  food={food}
                  onUpdate={(updatedFood) => {
                    const newFoods = structuredClone(foods);
                    newFoods[i] = updatedFood;
                    setFoods(newFoods);
                  }}
                  onRemove={() => {
                    const newFoods = structuredClone(foods);
                    newFoods.splice(i, 1);
                    setFoods(newFoods);
                  }}
                />
              ))}

              {isMobile ? (
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">
                      Total Calories: {foods.reduce((sum, food) => sum + (food.calories || 0), 0)}
                    </p>
                    <p className="text-sm font-medium">
                      Total Protein: {foods.reduce((sum, food) => sum + (food.protein || 0), 0)}g
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFoods([]);
                        setImageData(null);
                        setMealSummary("");
                      }}
                    >
                      Start Over
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setFoods(structuredClone(originalFoods))}
                      disabled={foods.length === 0}
                    >
                      Reset to Original
                    </Button>
                    <Button
                      onClick={() => handleSubmit(foods)}
                      disabled={foods.length === 0 || isPending}
                    >
                      {isPending ? "Saving..." : "Log Meal"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between mt-4">
                  <div>
                    <p className="text-sm font-medium">
                      Total Calories: {foods.reduce((sum, food) => sum + (food.calories || 0), 0)}
                    </p>
                    <p className="text-sm font-medium">
                      Total Protein: {foods.reduce((sum, food) => sum + (food.protein || 0), 0)}g
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFoods([]);
                        setImageData(null);
                        setMealSummary("");
                      }}
                    >
                      Start Over
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setFoods(structuredClone(originalFoods))}
                      disabled={foods.length === 0}
                    >
                      Reset to Original
                    </Button>
                    <Button
                      onClick={() => handleSubmit(foods)}
                      disabled={foods.length === 0 || isPending}
                    >
                      {isPending ? "Saving..." : "Log Meal"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
