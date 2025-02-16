'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CameraUpload } from "@/components/camera-upload";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Image from 'next/image'
import type { FoodProfile } from "app/food-entry/openai";
import { useRouter } from "next/navigation";
import FoodEntryItem from "./food-entry-item";
import { analyzeFoodImage } from "./actions";

export default function FoodEntry() {
  const { toast } = useToast();
  const router = useRouter();
  const [foods, setFoods] = useState<FoodProfile[]>([]);
  const [mealSummary, setMealSummary] = useState<string>("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeFood = async (formData: FormData) => {
    try {
      setIsAnalyzing(true);
      const data = await analyzeFoodImage(formData);
      setFoods(data.foods);
      setImageData(data.image);
      setMealSummary(data.meal_summary);
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

  const submitMutation = useMutation({
    mutationFn: async (foods: FoodProfile[]) => {
      const payload = {
        userId: 1,
        name: `Meal ${new Date().toLocaleTimeString()}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        clientTimestamp: new Date().toISOString(),
        mealSummary,
        foodLogs: foods.map(food => ({
          name: food.name,
          calories: food.calories,
          protein: food.protein.toString(),
          portionSize: food.estimated_portion.count.toString(),
          portionUnit: food.estimated_portion.unit
        })),
      };
      
      return await apiRequest("POST", "/api/meals", payload);
    },
    onSuccess: () => {
      toast({ title: "Meal logged successfully!" });
      router.push('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to log meal",
        description: error.message,
        variant: "destructive"
      });
    }
  });

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
                    const newFoods = [...foods];
                    newFoods[i] = updatedFood;
                    setFoods(newFoods);
                  }}
                  onRemove={() => {
                    const newFoods = [...foods];
                    newFoods.splice(i, 1);
                    setFoods(newFoods);
                  }}
                />
              ))}

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
                    }}
                  >
                    Start Over
                  </Button>
                  <Button
                    onClick={() => submitMutation.mutate(foods)}
                    disabled={foods.length === 0 || submitMutation.isPending}
                  >
                    {submitMutation.isPending ? "Saving..." : "Log Meal"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
