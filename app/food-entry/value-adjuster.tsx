import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Food } from './food-entry-item';
import { useValueAdjuster } from './use-value-adjuster';

interface ValueAdjusterProps {
  label: string;
  value: number;
  field: 'portion' | 'calories' | 'protein';
  step: number;
  food: Food;
  isActive: boolean;
  isProportionLocked: boolean;
  hasConnector?: boolean;
  isFirst?: boolean;
  onValueChange: (value: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onToggleActive: () => void;
}

const ValueAdjuster: React.FC<ValueAdjusterProps> = ({ 
  label, 
  value,
  field, 
  step,
  food,
  isActive,
  isProportionLocked,
  hasConnector = false,
  isFirst = false,
  onValueChange,
  onIncrement,
  onDecrement,
  onToggleActive
}) => {
  const {
    isEditing,
    inputRef,
    handleValueClick,
    handleInputChange,
    handleInputBlur,
    handleKeyDown
  } = useValueAdjuster({
    initialValue: value,
    step,
    field,
    onValueChange
  });
  
  const formattedValue = field === 'portion' ? 
    `${value} ${food.estimated_portion.unit}` :
    field === 'protein' ? 
      `${value}g` : 
      Math.round(value);

  return (
    <div className="space-y-2">
      <button
        onClick={onToggleActive}
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
            {hasConnector && isProportionLocked && !isFirst && (
              <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-orange-400 z-10"></div>
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
              onClick={onIncrement}
              className="flex min-w-[84px] h-10 grow bg-[#ee7c2b] text-[#1b130d] hover:bg-[#ee7c2b]/90"
            >
              +
            </Button>
            <Button
              onClick={onDecrement}
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

export default ValueAdjuster;