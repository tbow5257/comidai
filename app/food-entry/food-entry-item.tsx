import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EstimatedPortion = {
    count: number;
    unit: 'g' | 'oz';  // Restricted to just grams and ounces for MVP
  };
  
  export type Food = {
    name: string;
    estimated_portion: EstimatedPortion;
    size_description: string;
    typical_serving: string;
    calories: number;
    protein: number;
  };
  
  export type FoodEntryItemProps = {
    food: Food;
    onUpdate: (updatedFood: Food) => void;
    onRemove: () => void;
  };
  
  // Base values type used internally in the component
  export type BaseValues = {
    calories: number;
    protein: number;
    portion: number;
  };
  

const FoodEntryItem: React.FC<FoodEntryItemProps> = ({ food, onUpdate, onRemove }) => {
  // Store base values for proportional calculations
  const [baseValues, setBaseValues] = useState({
    calories: food.calories,
    protein: food.protein,
    portion: food.estimated_portion.count
  });

  // Calculate ratio for any numeric change
  const updateProportionally = (
    newValue: number,
    field: keyof BaseValues
  ) => {
    const ratio = newValue / baseValues[field];
    const updatedFood = { ...food };
    
    // Update all related fields proportionally
    if (field === 'portion') {
      updatedFood.estimated_portion.count = newValue;
      updatedFood.calories = Math.round(baseValues.calories * ratio);
      updatedFood.protein = Math.round(baseValues.protein * ratio * 10) / 10;
    } else if (field === 'calories') {
      updatedFood.calories = newValue;
      updatedFood.estimated_portion.count = Math.round(baseValues.portion * ratio * 10) / 10;
      updatedFood.protein = Math.round(baseValues.protein * ratio * 10) / 10;
    } else if (field === 'protein') {
      updatedFood.protein = newValue;
      updatedFood.estimated_portion.count = Math.round(baseValues.portion * ratio * 10) / 10;
      updatedFood.calories = Math.round(baseValues.calories * ratio);
    }

    onUpdate(updatedFood);
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={food.estimated_portion.count}
            onChange={(e) => updateProportionally(Number(e.target.value), 'portion')}
            className="w-24"
          />
          <Select
            value={food.estimated_portion.unit}
            onValueChange={(value) => {
              if (value === "g" || value === "oz") {
                onUpdate({
                  ...food,
                  estimated_portion: { ...food.estimated_portion, unit: value },
                });
              } else {
                console.error(`Invalid unit: ${value}`);
              }
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue>{food.estimated_portion.unit}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="g">grams</SelectItem>
              <SelectItem value="oz">ounces</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={food.calories}
            onChange={(e) => updateProportionally(Number(e.target.value), 'calories')}
            className="w-24"
          />
          <span>calories</span>
          
          <Input
            type="number"
            value={food.protein}
            onChange={(e) => updateProportionally(Number(e.target.value), 'protein')}
            className="w-24"
          />
          <span>protein (g)</span>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>Typical portion: {food.size_description}</p>
        <p>Serving size: {food.typical_serving}</p>
      </div>

      <Button variant="destructive" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
};

export default FoodEntryItem;
