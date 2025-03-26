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
  const [isEditing, setIsEditing] = useState(false);
  // Store base values for proportional calculations
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

    // Round to 1 decimal place
    newCount = Math.round(newCount * 10) / 10;

    onUpdate({
      ...food,
      estimated_portion: { count: newCount, unit: newUnit },
    });
    
  }

  // Update individual field without proportionality
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
    
    // If locking, update base values to current values
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

  const ValueAdjuster = ({ 
    label, 
    value, 
    unit, 
    field, 
    step,
    hasConnector = false,
    isFirst = false, 
  }: { 
    label: string;
    value: number;
    unit?: string;
    field: 'portion' | 'calories' | 'protein';
    step: number;
    hasConnector?: boolean;
    isFirst?: boolean;
  }) => {
    const isActive = activeAdjuster === field;
    const inputRef = useRef<HTMLInputElement>(null);
    
    const formattedValue = field === 'portion' ? 
      `${value} ${food.estimated_portion.unit}` :
      field === 'protein' ? 
        `${value}g` : 
        Math.round(value);

    const handleValueClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent button click handler
      if (isActive) {
        setIsEditing(true);
        // Focus and show number keyboard on mobile
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.click(); // Triggers mobile keyboard
        }
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (!isNaN(newValue)) {
        handleValueChange(newValue, field);
      }
    };

    const handleInputBlur = () => {
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setIsEditing(false);
      }
    };

    return (
      <div className="space-y-2">
        <button
          onClick={() => {
            setIsEditing(false);
            setActiveAdjuster(isActive ? null : field);
          }}
          className={cn(
            "w-full px-4 py-2 text-left rounded-lg transition-colors",
            "text-[#1b130d] text-base font-normal",
            "hover:bg-[#f3ece7]/50",
            isActive ? "bg-[#f3ece7]" : "bg-transparent"
          )}
        >
          <span className="flex justify-between items-center">
            <span>{label}</span>
            <span 
              className={cn(
                "font-medium relative",
                isActive && !isEditing && "after:content-['|'] after:ml-[1px] after:animate-blink after:opacity-70"
              )}
              onClick={handleValueClick}
            >
              {/* Connector line from value to value */}
              {hasConnector && isProportionLocked && !isFirst && (
                <div className="absolute left-1/2 -top-8 h-8 w-0.5 bg-orange-400 z-10"></div>
              )}
              
              {isActive && isEditing ? (
                <input
                  ref={inputRef}
                  autoFocus
                  type="number"
                  value={value}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  step={step}
                  min={0}
                  className={cn(
                    "w-20 bg-transparent text-right",
                    "focus:outline-none focus:ring-0",
                    "[-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  )}
                />
              ) : (
                formattedValue
              )}
            </span>
          </span>
        </button>

        {isActive && (
          <div className="flex justify-center animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-1 gap-3 flex-wrap max-w-[480px] justify-center px-2">
              <Button
                onClick={() => handleIncrement(field, step)}
                className="flex min-w-[84px] h-10 grow bg-[#ee7c2b] text-[#1b130d] hover:bg-[#ee7c2b]/90"
              >
                +
              </Button>
              <Button
                onClick={() => handleDecrement(field, step)}
                className="flex min-w-[84px] h-10 grow bg-[#f3ece7] text-[#1b130d] hover:bg-[#f3ece7]/90"
              >
                -
              </Button>
            </div>
          </div>
        )}
      </div>
    );
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
      className: "sm:max-w-[300px]", // Smaller on mobile
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
              unit={food.estimated_portion.unit}
              field="portion"
              step={1}
              hasConnector={true}
              isFirst={true}
            />

            <ValueAdjuster
              label="Calories"
              value={food.calories}
              field="calories"
              step={10}
              hasConnector={true}
            />

            <ValueAdjuster
              label="Protein"
              value={food.protein}
              field="protein"
              step={1}
              hasConnector={true}
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
