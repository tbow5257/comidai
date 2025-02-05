
'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertFoodLog } from "@/lib/db/schema";

export default function ConfirmFoodEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const analysisId = searchParams.get('analysisId');
  const [foods, setFoods] = useState<Array<{
    name: string;
    portion: string;
    calories: number;
    protein_g: number;
    carbohydrates_g: number;
    fat_g: number;
  }>>([]);

  // Load analysis results
  useState(() => {
    if (analysisId) {
      apiRequest("GET", `/api/food-analysis/${analysisId}`)
        .then(res => res.json())
        .then(data => setFoods(data.foods))
        .catch(err => {
          toast({ 
            title: "Failed to load analysis",
            description: err.message,
            variant: "destructive"
          });
          router.push('/food-entry');
        });
    }
  }, [analysisId]);

  const submitMutation = useMutation({
    mutationFn: async (data: InsertFoodLog) => {
      await apiRequest("POST", "/api/food-logs", data);
    },
    onSuccess: () => {
      router.push('/');
      toast({ title: "Food logged successfully!" });
    },
  });

  const handleSubmit = (food: typeof foods[0]) => {
    submitMutation.mutate({
      name: food.name,
      portionSize: food.portion,
      calories: food.calories,
      protein: food.protein_g.toString(),
      carbs: food.carbohydrates_g.toString(),
      fat: food.fat_g.toString(),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Confirm Food Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {foods.map((food, i) => (
            <div key={i} className="space-y-4 mb-6 p-4 border rounded">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  value={food.name}
                  onChange={e => {
                    const newFoods = [...foods];
                    newFoods[i].name = e.target.value;
                    setFoods(newFoods);
                  }}
                  placeholder="Food name"
                />
                <Input 
                  value={food.portion}
                  onChange={e => {
                    const newFoods = [...foods];
                    newFoods[i].portion = e.target.value;
                    setFoods(newFoods);
                  }}
                  placeholder="Portion size"
                />
                <Input 
                  type="number"
                  value={food.calories}
                  onChange={e => {
                    const newFoods = [...foods];
                    newFoods[i].calories = Number(e.target.value);
                    setFoods(newFoods);
                  }}
                  placeholder="Calories"
                />
                <Input 
                  type="number"
                  value={food.protein_g}
                  onChange={e => {
                    const newFoods = [...foods];
                    newFoods[i].protein_g = Number(e.target.value);
                    setFoods(newFoods);
                  }}
                  placeholder="Protein (g)"
                />
                <Input 
                  type="number"
                  value={food.carbohydrates_g}
                  onChange={e => {
                    const newFoods = [...foods];
                    newFoods[i].carbohydrates_g = Number(e.target.value);
                    setFoods(newFoods);
                  }}
                  placeholder="Carbs (g)"
                />
                <Input 
                  type="number"
                  value={food.fat_g}
                  onChange={e => {
                    const newFoods = [...foods];
                    newFoods[i].fat_g = Number(e.target.value);
                    setFoods(newFoods);
                  }}
                  placeholder="Fat (g)"
                />
              </div>
              <Button 
                onClick={() => handleSubmit(food)}
                className="w-full"
              >
                Log This Food
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
