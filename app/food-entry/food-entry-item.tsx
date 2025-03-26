import React, { useEffect, useState, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils";
import { Trash2, Lock, Unlock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ValueAdjuster from './value-adjuster';

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
  const isMobile = useIsMobile()
  const [activeAdjuster, setActiveAdjuster] = useState<'portion' | 'calories' | 'protein' | null>(null);
  const [isProportionLocked, setIsProportionLocked] = useState(true);

  const [baseValues, setBaseValues] = useState({
    calories: food.calories,
    protein: food.protein,
    portion: food.estimated_portion.count
  });

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const { toast } = useToast()

  // Update base values when proportion lock is toggled
  useEffect(() => {
    if (isProportionLocked) {
      setBaseValues({
        calories: food.calories,
        protein: food.protein,
        portion: food.estimated_portion.count
      });
    }
  }, [isProportionLocked, food]);

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

    newCount = Math.round(newCount * 10) / 10;

    onUpdate({
      ...food,
      estimated_portion: { count: newCount, unit: newUnit },
    });
  }

  const updateIndividually = (
    newValue: number,
    field: keyof BaseValues
  ) => {
    const updatedFood = { ...food };
    
    if (field === 'portion') {
      updatedFood.estimated_portion.count = newValue;
    } else {
      updatedFood[field] = field === 'protein' ? 
        Math.round(newValue * 10) / 10 : 
        Math.round(newValue);
    }

    onUpdate(updatedFood);
  };

  const updateProportionally = (
    newValue: number,
    field: keyof BaseValues
  ) => {
    const ratio = newValue / baseValues[field];
    const updatedFood = { ...food };
    
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

  const handleValueChange = (
    newValue: number,
    field: keyof BaseValues
  ) => {
    if (isProportionLocked) {
      updateProportionally(newValue, field);
    } else {
      updateIndividually(newValue, field);
    }
  };

  const handleIncrement = (field: keyof BaseValues, step: number) => {
    const newValue = field === 'portion' ? 
      food.estimated_portion.count + step :
      (food[field] as number) + step;
    handleValueChange(newValue, field);
  };

  const handleDecrement = (field: keyof BaseValues, step: number) => {
    const newValue = field === 'portion' ? 
      Math.max(0, food.estimated_portion.count - step) :
      Math.max(0, (food[field] as number) - step);
    handleValueChange(newValue, field);
  };

  const toggleProportionLock = () => {
    setIsProportionLocked(!isProportionLocked);
    
    if (!isProportionLocked) {
      setBaseValues({
        calories: food.calories,
        protein: food.protein,
        portion: food.estimated_portion.count
      });

      toast({
        title: "Proportional changes enabled",
        description: "Values will change together",
        duration: 1500
      });
    } else {
      toast({
        title: "Independent changes enabled",
        description: "Values will change individually",
        duration: 1500
      });
    }
  };

  const LockButton = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleProportionLock}
      className={cn(
        "h-8 w-8 rounded-full transition-colors",
        isProportionLocked ? 
          "bg-orange-100 hover:bg-orange-200 text-orange-600" : 
          "bg-gray-100 hover:bg-gray-200 text-gray-600"
      )}
      title={isProportionLocked ? "Values change proportionally" : "Values change independently"}
    >
      {isProportionLocked ? (
        <Lock className="h-4 w-4" />
      ) : (
        <Unlock className="h-4 w-4" />
      )}
    </Button>
  );

  const handleRemove = () => {
    onRemove()
    toast({
      title: "Food removed",
      description: food.name,
      duration: 2000,
      className: "sm:max-w-[300px]",
      variant: "destructive"
    })
  }

  const RemoveButton = () => (
    <div className="relative">
      {showRemoveConfirm ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRemove}
          className="animate-in slide-in-from-left-2 duration-200"
        >
          Remove
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowRemoveConfirm(true)}
          className="h-8 w-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 p-4 border rounded">
      {isMobile ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{food.name}</h3>
            <div className="flex items-center space-x-2">
              <LockButton />
              <RemoveButton />
            </div>
          </div>

          <div className="space-y-2">
            <ValueAdjuster
              label="Portion size"
              value={food.estimated_portion.count}
              field="portion"
              step={1}
              food={food}
              isActive={activeAdjuster === 'portion'}
              isProportionLocked={isProportionLocked}
              hasConnector={true}
              isFirst={true}
              onValueChange={(value: number) => handleValueChange(value, 'portion')}
              onIncrement={() => handleIncrement('portion', 1)}
              onDecrement={() => handleDecrement('portion', 1)}
              onToggleActive={() => setActiveAdjuster(activeAdjuster === 'portion' ? null : 'portion')}
            />

            <ValueAdjuster
              label="Calories"
              value={food.calories}
              field="calories"
              step={10}
              food={food}
              isActive={activeAdjuster === 'calories'}
              isProportionLocked={isProportionLocked}
              hasConnector={true}
              onValueChange={(value: number) => handleValueChange(value, 'calories')}
              onIncrement={() => handleIncrement('calories', 10)}
              onDecrement={() => handleDecrement('calories', 10)}
              onToggleActive={() => setActiveAdjuster(activeAdjuster === 'calories' ? null : 'calories')}
            />

            <ValueAdjuster
              label="Protein"
              value={food.protein}
              field="protein"
              step={1}
              food={food}
              isActive={activeAdjuster === 'protein'}
              isProportionLocked={isProportionLocked}
              hasConnector={true}
              onValueChange={(value: number) => handleValueChange(value, 'protein')}
              onIncrement={() => handleIncrement('protein', 1)}
              onDecrement={() => handleDecrement('protein', 1)}
              onToggleActive={() => setActiveAdjuster(activeAdjuster === 'protein' ? null : 'protein')}
            />
          </div>

          {activeAdjuster === 'portion' && (
            <Select
              value={food.estimated_portion.unit}
              onValueChange={(value: 'g' | 'oz') => handleUnitChange(value)}
            >
              <SelectTrigger className="w-24">
                <SelectValue>{food.estimated_portion.unit}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">grams</SelectItem>
                <SelectItem value="oz">ounces</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      ) : (
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
              onChange={(e) => handleValueChange(Number(e.target.value), 'portion')}
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
                onChange={(e) => handleValueChange(Number(e.target.value), 'calories')}
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
                    handleValueChange(Math.round(value * 10) / 10, 'protein');
                  }
                }}
                className="w-24"
              />
              <span>protein (g)</span>

              {isProportionLocked && (
                <div className="flex items-center ml-2">
                  <div className="h-0.5 w-10 bg-orange-400"></div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <LockButton />
              <RemoveButton />
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>Typical portion: {food.size_description} - about {food.typical_serving}</p>
      </div>


    </div>
  );
};

export default FoodEntryItem;
