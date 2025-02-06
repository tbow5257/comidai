import React from 'react';

import CreatableSelect from 'react-select/creatable';

interface Option {
  label: string;
  value: string;
}

interface Props<T extends Option> {
    options: T[];
    onChange?: (newValue: T) => void;
    value?: T | null;
    onCreateOption?: (label: string) => void;
  }
  
const SelectCreatable = <T extends Option>({ options, onChange, value, onCreateOption }: Props<T>) => {
    const handleChange = (newValue: T | null) => {
    if (onChange && newValue) {
      onChange(newValue);
    }
  };

  const handleCreate = (inputValue: string) => {
    if (onCreateOption) {
      onCreateOption(inputValue);
    }
  };

  return (
    <CreatableSelect
      isClearable
      options={options}
      onChange={handleChange}
      onCreateOption={handleCreate}
      value={value}
    />
  );
};

export default SelectCreatable;
