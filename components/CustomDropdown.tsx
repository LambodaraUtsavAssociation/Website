'use client';

import { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  count?: number;
  sublabel?: string;
}

interface CustomDropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function CustomDropdown({
  label,
  options,
  value,
  onChange,
  className = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-ivory-400 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-charcoal-900 border-l-2 border-gold-400 border-y border-r border-charcoal-700 text-gold-300 py-3.5 pl-4 pr-10 text-xs font-semibold uppercase tracking-[0.15em] text-left flex items-center justify-between shadow-lg focus:outline-none hover:border-gold-300 transition-all cursor-pointer"
      >
        <span className="truncate">
          {selectedOption ? (
            <span>
              {selectedOption.sublabel && <span className="text-gold-400/80 font-mono text-[11px] mr-1.5">{selectedOption.sublabel}</span>}
              {selectedOption.label}
              {selectedOption.count !== undefined && <span className="text-[10px] opacity-70 ml-1.5">({selectedOption.count})</span>}
            </span>
          ) : (
            'Select Option'
          )}
        </span>
        <span className={`text-[10px] text-gold-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          &#9660;
        </span>
      </button>

      {/* Custom Animated Popover Options Tray */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-charcoal-900 border border-gold-500/40 shadow-2xl py-1.5 max-h-64 overflow-y-auto no-scrollbar animate-fade-in">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-left flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'text-gold-300 bg-saffron-600/15 border-l-2 border-gold-400'
                    : 'text-ivory-200 hover:text-ivory-50 hover:bg-charcoal-800/60'
                }`}
              >
                <span className="truncate">
                  {opt.sublabel && <span className="text-gold-400/80 font-mono text-[11px] mr-1.5">{opt.sublabel}</span>}
                  {opt.label}
                </span>
                {opt.count !== undefined && (
                  <span className={`text-[10px] ${isSelected ? 'text-gold-400' : 'text-ivory-400'}`}>
                    ({opt.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
