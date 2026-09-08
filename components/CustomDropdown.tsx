'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  displayLabel?: string;
  count?: number;
  sublabel?: string;
  isGroupHeader?: boolean;
  indent?: boolean;
}

interface CustomDropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  variant?: 'default' | 'iconOnly';
  className?: string;
  buttonClassName?: string;
  lightMode?: boolean;
}

export default function CustomDropdown({
  label,
  options,
  value,
  onChange,
  icon,
  placeholder = 'Select Option',
  variant = 'default',
  className = '',
  buttonClassName = '',
  lightMode = false,
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
      {label && variant !== 'iconOnly' && (
        <label className={`block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5 flex items-center space-x-1.5 ${lightMode ? 'text-orange-700 font-bold' : 'text-gold-400'}`}>
          {icon || <Filter className={`w-3 h-3 ${lightMode ? 'text-orange-500' : 'text-gold-400'}`} />}
          <span>{label}</span>
        </label>
      )}

      {/* Trigger Button */}
      {variant === 'iconOnly' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Filter Gallery"
          aria-label="Filter Gallery"
          className={`p-3 rounded-full transition-all focus:outline-none cursor-pointer flex items-center justify-center border-0 active:scale-95 group relative ${
            lightMode
              ? 'bg-white border-2 border-orange-200 text-orange-600 hover:bg-orange-50 shadow-xs'
              : 'bg-charcoal-900/90 hover:bg-gold-500/20 text-gold-400 hover:text-gold-300 shadow-2xl'
          } ${buttonClassName}`}
        >
          {icon || <Filter className={`w-5 h-5 group-hover:scale-110 transition-transform ${lightMode ? 'text-orange-500' : 'text-gold-400'}`} />}
          {value !== 'all' && (
            <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full animate-pulse ${lightMode ? 'bg-orange-500 ring-2 ring-white' : 'bg-gold-400 ring-2 ring-charcoal-950'}`} />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-10 rounded-xl px-3.5 text-xs font-bold uppercase tracking-wider text-left flex items-center justify-between focus:outline-none transition-all cursor-pointer group ${
            lightMode
              ? 'bg-white border-2 border-orange-200 hover:border-orange-500 text-slate-900 shadow-xs'
              : 'bg-charcoal-900 border border-charcoal-700 hover:border-gold-500/50 text-ivory-100 shadow-lg'
          } ${buttonClassName}`}
        >
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className={`p-1.5 rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform ${lightMode ? 'bg-orange-100 text-orange-600' : 'bg-gold-500/10 border border-gold-500/20 text-gold-400'}`}>
              {icon || <Filter className={`w-3.5 h-3.5 ${lightMode ? 'text-orange-500' : 'text-gold-400'}`} />}
            </div>
            <span className="truncate">
              {selectedOption ? (
                <span className="flex items-center space-x-1.5 truncate">
                  {selectedOption.sublabel && (
                    <span className={`font-mono text-[11px] flex-shrink-0 ${lightMode ? 'text-orange-600 font-bold' : 'text-gold-400/80'}`}>
                      {selectedOption.sublabel}
                    </span>
                  )}
                  <span className="truncate">
                    {selectedOption.displayLabel || selectedOption.label.replace(/^└\s*/, '')}
                  </span>
                  {selectedOption.count !== undefined && (
                    <span className={`text-[10px] font-mono flex-shrink-0 ml-1 ${lightMode ? 'text-orange-600 font-bold' : 'text-gold-400 opacity-80'}`}>
                      ({selectedOption.count})
                    </span>
                  )}
                </span>
              ) : (
                placeholder
              )}
            </span>
          </div>

          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
              lightMode ? 'text-orange-500' : 'text-gold-400'
            } ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>
      )}

      {/* Custom Animated Popover Options Tray */}
      {isOpen && (
        <div className={`absolute top-full right-0 mt-2 min-w-[260px] w-64 sm:w-72 z-[100] rounded-2xl shadow-2xl py-2 max-h-80 overflow-y-auto no-scrollbar animate-fade-in backdrop-blur-2xl ${
          lightMode
            ? 'bg-white border-2 border-orange-300 text-slate-800'
            : 'bg-charcoal-900/98 border border-gold-500/50 text-ivory-100'
        }`}>
          <div className={`px-4 py-2 border-b text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-between ${
            lightMode ? 'border-orange-100 text-orange-700' : 'border-charcoal-800 text-gold-400'
          }`}>
            <span>Select Filter Option</span>
            {value !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  onChange('all');
                  setIsOpen(false);
                }}
                className={`lowercase text-[11px] underline font-bold ${lightMode ? 'text-orange-600 hover:text-orange-800' : 'text-ivory-400 hover:text-gold-300'}`}
              >
                reset
              </button>
            )}
          </div>

          {options.map((opt) => {
            const isSelected = opt.value === value;
            const isHeader = opt.isGroupHeader;
            const isIndented = opt.indent;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-left flex items-center justify-between transition-colors ${
                  isIndented ? 'pl-7 sm:pl-8 text-[11px] font-semibold' : ''
                } ${
                  isHeader ? 'bg-orange-50/80 font-extrabold text-orange-900 border-t border-orange-100 mt-1' : ''
                } ${
                  isSelected
                    ? lightMode
                      ? 'text-orange-700 bg-orange-100/90 border-l-4 border-orange-500 font-extrabold'
                      : 'text-gold-300 bg-gold-500/15 border-l-2 border-gold-400 font-extrabold'
                    : lightMode
                    ? 'text-slate-700 hover:text-orange-600 hover:bg-orange-50/50'
                    : 'text-ivory-200 hover:text-ivory-50 hover:bg-charcoal-800/80'
                }`}
              >
                <span className="truncate flex items-center space-x-2">
                  {opt.sublabel && (
                    <span className={`font-mono text-[11px] flex-shrink-0 ${lightMode ? 'text-orange-600 font-bold' : 'text-gold-400/80'}`}>
                      {opt.sublabel}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </span>
                {opt.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      isSelected
                        ? lightMode
                          ? 'bg-orange-200 text-orange-900 font-extrabold'
                          : 'bg-gold-500/25 text-gold-300 border border-gold-400/30'
                        : lightMode
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-charcoal-800 text-ivory-400'
                    }`}
                  >
                    {opt.count}
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
