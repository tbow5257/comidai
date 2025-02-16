import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GRAMS_PER_OUNCE = 28.3495;

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

  const [baseValues] = useState({
    calories: food.calories,
    protein: food.protein,
    portion: food.estimated_portion.count
  });

  const handleUnitChange = (newUnit: 'g' | 'oz') => {
    const currentCount = food.estimated_portion.count;
    const currentUnit = food.estimated_portion.unit;
    
    let newCount: number;
    if (currentUnit === 'g' && newUnit === 'oz') {
      newCount = currentCount / GRAMS_PER_OUNCE;
    } else if (currentUnit === 'oz' && newUnit === 'g') {
      newCount = currentCount * GRAMS_PER_OUNCE;
    } else {
      newCount = currentCount;
    }

    // Round to 1 decimal place
    newCount = Math.round(newCount * 10) / 10;

    onUpdate({
      ...food,
      estimated_portion: { count: newCount, unit: newUnit },
    });
    
  }

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
          <p>Name</p>
          <Input
            type="text"
            value={food.name}
            onChange={(e) => onUpdate({ ...food, name: e.target.value })}
            className="w-24"
          />
          <p>Portion</p>
          <Input
            type="number"
            step="0.1"
            value={Math.round(food.estimated_portion.count * 10) / 10}
            onChange={(e) => updateProportionally(Number(e.target.value), 'portion')}
            className="w-24"
            min={0}
          />
          <Select
            value={food.estimated_portion.unit}
            onValueChange={(value) => {
              if (value === "g" || value === "oz") {
                handleUnitChange(value);
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

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={Math.round(food.calories)}
              min={0}
              step={1}
              onChange={(e) => updateProportionally(Number(e.target.value), 'calories')}
              className="w-24"
            />
            <span>calories</span>
            
            <Input
              type="number"
              value={Math.round(food.protein * 10) / 10}
              min={0}
              step="0.1"
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  updateProportionally(Math.round(value * 10) / 10, 'protein');
                }
              }}
              className="w-24"
            />
            <span>protein (g)</span>
          </div>
          <Button variant="destructive" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>Typical portion: {food.size_description} - about {food.typical_serving}</p>
      </div>


    </div>
  );
};

export default FoodEntryItem;
