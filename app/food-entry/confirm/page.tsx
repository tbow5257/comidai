'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertFoodLog } from "@/lib/db/schema";
import { FoodProfile } from "@/lib/openai";
import Image from 'next/image'
import FoodEntryItem from "./food-entry-item";

// old food analysis
// type FoodAnalysis = {
//   name: string;
//   portion: string;
//   calories: number;
//   protein_g: number;
//   carbohydrates_g: number;
//   fat_g: number;
// }

type AnalysisResponse = {
  status?: 'pending' | 'complete';
  foods?: FoodProfile[];
  image?: string;
  error?: string;
}

const getImageSrc = (base64String: string) => {
  // Check if it's already a data URL
  if (base64String.startsWith('data:image')) {
    return base64String;
  }
  // Add proper data URL prefix for images
  return `data:image/jpeg;base64,${base64String}`;
};

export default function ConfirmFoodEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const analysisId = searchParams.get('analysisId');
  const [foods, setFoods] = useState<FoodProfile[]>([]);
  const [imageData, setImageData] = useState<string | null>(null);

  const { data, isError, error, isLoading } = useQuery<AnalysisResponse>({
    queryKey: ['foodAnalysis', analysisId],
    queryFn: async (): Promise<AnalysisResponse> => {
      if (!analysisId) return { foods: [] };
      const res = await apiRequest("GET", `/api/food-analysis/${analysisId}`);
      if (res.status === 202) return { status: 'pending' };
      const data: AnalysisResponse = await res.json();
      if (data.error) throw new Error(data.error);
      console.log('data', data)
      return { status: 'complete', foods: data?.foods?.foods, image: data.image };
    },
    refetchInterval: (query) => {

      return query?.state?.data?.status === 'pending' ? 1000 : false
    },
    retry: (failureCount, error) => failureCount < 2 && error instanceof Error && error.message !== 'pending',
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

  // Handle successful dataddddddd
  useEffect(() => {
    if (data?.foods) {
      setFoods(data.foods);
    }
    if (data?.image) {
      setImageData(data.image);
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
        {imageData && (
            <div className="mb-6 flex justify-center">
              <div className="relative w-full max-w-[900px] md:w-1/2 aspect-[3/2]">
                <Image 
                  src={getImageSrc(imageData)}
                  alt="Food analysis"
                  fill
                  className="rounded-lg shadow-lg object-contain"
                  priority
                  unoptimized // Since we're using data URLs
                />
              </div>
            </div>
        )}
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
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium">
                Calories: {foods.reduce((sum, food) => sum + (food.calories || 0), 0)}
              </p>
              <p className="text-sm font-medium">
                Protein: {foods.reduce((sum, food) => sum + (food.protein || 0), 0)}g
              </p>
            </div>

          <div className="flex justify-center">
            <Button
              onClick={() => {
                // TODO: Implement logic to handle all foods at once
                console.log("Logging all foods:", foods);
              }}
            >
              Accept All Foods
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}