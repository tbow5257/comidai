export interface FoodProfile {
    name: string;
    estimated_portion: {
      count: number;
      unit: 'g' | 'oz';
    };
    size_description: string;
    typical_serving: string;
    calories: number;
    protein: number;
  }
  
export interface Meal {
    foods: FoodProfile[];
    meal_summary: string;
  }
  