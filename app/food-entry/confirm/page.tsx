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
import { FoodProfile } from "@/lib/openai";
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SelectCreatable from "@/components/ui/select-creatable";

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
            <div key={i} className="space-y-4 mb-6 p-4 border rounded">
              <div className="grid grid-cols-2 gap-4">
                <SelectCreatable 
                  // possibly async populate with DB options
                  options={[{label: 'salmon', value: 'salmon'}, {label: 'chicken', value: 'chicken'}, {label: 'beef', value: 'beef'}]}
                  value={{label: food.name, value: food.name}}
                  onChange={(newValue) => {
                    const newFoods = [...foods];
                    newFoods[i].name = newValue.value;
                    setFoods(newFoods);
                  }}
                  onCreateOption={(label) => {
                    console.log('Create option', label);
                    // TODO: API (LLM) ask it whether it makes sense as a food item
                    // 
                    // 
                    // - If it makes sense as a food item, go with what the user has inputted
                    // - If it sounds strange using some kind of judgment system prompt them with a pop-up like are you sure you want to put this in that kind of thing
                  }}
                />
                <div className="flex items-center space-x-2">
                  <Input 
                    type="number"
                    value={food.estimated_portion.count}
                    onChange={e => {
                      const newFoods = [...foods];
                      newFoods[i].estimated_portion.count = parseInt(e.target.value);
                      setFoods(newFoods);
                    }}
                    placeholder="Estimated Portion"
                  />
                  <Select>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder={food.estimated_portion.unit}>{food.estimated_portion.unit}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grams">grams</SelectItem>
                      <SelectItem value="ounces">ounces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p>Typical Portion Size: {food.size_description}. Typical Serving: {food.typical_serving}</p>
                </div>
                {/* <Input 
                  value={food.typical_serving}
                  onChange={e => {
                    const newFoods = [...foods];
                    newFoods[i].typical_serving = e.target.value;
                    setFoods(newFoods);
                  }}
                  placeholder="Typical Serving"
                /> */}
                <div className="flex items-center space-x-2">
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
                  <span>cal/kcal</span>
                </div>
                <Button 
                  // onClick={() => handleSubmit(food)}
                  className="w-full"
                >
                  Log This Food
                </Button>
                <Button variant="destructive" className="w-1/2"
                  onClick={() => {
                    const newFoods = [...foods];
                    newFoods.splice(i, 1);
                    setFoods(newFoods);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
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
        </CardContent>
      </Card>
    </div>
  );
}