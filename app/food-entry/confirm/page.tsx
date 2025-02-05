'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertFoodLog } from "@/lib/db/schema";

type FoodAnalysis = {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
}

type AnalysisResponse = {
  status?: 'pending';
  foods?: FoodAnalysis[];
  error?: string;
}

export default function ConfirmFoodEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const analysisId = searchParams.get('analysisId');
  const [foods, setFoods] = useState<FoodAnalysis[]>([]);

  const { data, isError, error, isLoading } = useQuery({
    queryKey: ['foodAnalysis', analysisId],
    queryFn: async () => {
      if (!analysisId) return { foods: [] };
      const res = await apiRequest("GET", `/api/food-analysis/${analysisId}`);
      if (res.status === 202) {
        return { status: 'pending' as const };
      }
      const data: AnalysisResponse = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    },
    refetchInterval: (data) => {
      return data?.status === 'pending' ? 1000 : false;
    },
    retry: (failureCount, error) => {
      return error instanceof Error && 
             error.message === 'pending';
    },
  });

  // Handle error state
  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({ 
        title: "Failed to load analysis",
        description: error.message,
        variant: "destructive"
      });
      router.push('/food-entry');
    }
  }, [isError, error, toast, router]);

  // Handle successful data
  useEffect(() => {
    if (data?.foods) {
      setFoods(data.foods);
    }
  }, [data]);

  const submitMutation = useMutation({
    mutationFn: async (data: InsertFoodLog) => {
      await apiRequest("POST", "/api/food-logs", data);
    }
  });

  // Handle mutation states
  useEffect(() => {
    if (submitMutation.isSuccess) {
      router.push('/');
      toast({ title: "Food logged successfully!" });
    }
    if (submitMutation.isError && submitMutation.error instanceof Error) {
      toast({
        title: "Failed to log food",
        description: submitMutation.error.message,
        variant: "destructive"
      });
    }
  }, [submitMutation.isSuccess, submitMutation.isError, submitMutation.error, router, toast]);

  // Show loading state
  if (isLoading || data?.status === 'pending') {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Analyzing Your Food...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                // onClick={() => handleSubmit(food)}
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
