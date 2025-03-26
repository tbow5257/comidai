import { useState, useRef } from 'react';
import { BaseValues } from './food-entry-item';

interface UseValueAdjusterProps {
  initialValue: number;
  step: number;
  field: keyof BaseValues;
  onValueChange: (value: number) => void;
}

export function useValueAdjuster({ initialValue, step, field, onValueChange }: UseValueAdjusterProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onValueChange(newValue);
    }
  };

  const handleInputBlur = () => setIsEditing(false);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') setIsEditing(false);
  };

  return {
    isEditing,
    inputRef,
    handleValueClick,
    handleInputChange,
    handleInputBlur,
    handleKeyDown,
    step,
    value: initialValue
  };
} 