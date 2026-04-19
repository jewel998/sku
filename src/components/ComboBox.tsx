import { useEffect, useMemo, useRef, useState } from 'react';

export interface ComboBoxOption {
  value: string;
  label: string;
}

interface ComboBoxProps {
  id: string;
  value: string;
  options: ComboBoxOption[];
  placeholder?: string;
  onValueChange: (value: string) => void;
}

export default function ComboBox({
  id,
  value,
  options,
  placeholder,
  onValueChange,
}: ComboBoxProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  const [inputValue, setInputValue] = useState(selectedOption?.label ?? value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(inputValue.toLowerCase())),
    [options, inputValue],
  );

  useEffect(() => {
    setInputValue(selectedOption?.label ?? value);
  }, [selectedOption?.label, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filteredOptions.length]);

  const selectOption = (option: ComboBoxOption) => {
    setInputValue(option.label);
    onValueChange(option.value);
    setOpen(false);
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const relatedTarget = event.relatedTarget as Node | null;
    if (!wrapperRef.current?.contains(relatedTarget)) {
      const match = options.find((option) => option.label === inputValue);
      if (match) {
        onValueChange(match.value);
      } else {
        onValueChange(inputValue);
      }
      setOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === 'Enter' && open && filteredOptions.length > 0) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative" onBlur={handleBlur}>
      <input
        id={id}
        ref={inputRef}
        value={inputValue}
        onChange={(event) => {
          setInputValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-controls={`${id}-listbox`}
        // aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
      />

      {open && filteredOptions.length > 0 ? (
        <div
          role="listbox"
          id={`${id}-listbox`}
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-600 bg-slate-800 shadow-xl"
        >
          {filteredOptions.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              className={`w-full px-3 py-2 text-left text-sm text-slate-100 transition-colors ${
                activeIndex === index ? 'bg-slate-700' : 'hover:bg-slate-700'
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
