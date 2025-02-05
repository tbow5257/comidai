"use client"
import { useState } from "react";
// import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CameraUpload } from "@/components/camera-upload";
import type { InsertFoodLog } from "@db/schema";

type FoodAnalysis = {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
};

export default function FoodEntry() {
  // const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const form = useForm<InsertFoodLog>();

  const analyzeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", "/api/analyze-food", formData);
      return res.json() as Promise<FoodAnalysis[]>;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertFoodLog) => {
      await apiRequest("POST", "/api/food-logs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-logs"] });
      // setLocation("/");
      toast({ title: "Food logged successfully!" });
    },
  });

  async function onImageCapture(formData: FormData) {
    setAnalyzing(true);
    try {
      const [firstFood] = await analyzeMutation.mutateAsync(formData);
      form.reset({
        name: firstFood.name,
        portionSize: firstFood.portion,
        calories: firstFood.calories,
        protein: firstFood.protein_g.toString(),
        carbs: firstFood.carbohydrates_g.toString(),
        fat: firstFood.fat_g.toString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Analysis failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-lg">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <CameraUpload onCapture={onImageCapture} analyzing={analyzing} />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(data => submitMutation.mutate(data))} 
                    className="space-y-4">
                <Input {...form.register("name")} placeholder="Food name" />
                <Input {...form.register("portionSize")} placeholder="Portion size" />
                <Input {...form.register("calories", { valueAsNumber: true })} 
                       type="number" placeholder="Calories" />
                <Input {...form.register("protein")} 
                       type="number" step="0.1" placeholder="Protein (g)" />
                <Input {...form.register("carbs")} 
                       type="number" step="0.1" placeholder="Carbs (g)" />
                <Input {...form.register("fat")} 
                       type="number" step="0.1" placeholder="Fat (g)" />

                <Button type="submit" className="w-full" 
                        disabled={submitMutation.isPending}>
                  Log Food
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}