import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const MultiSelect = ({
  options = [],
  value = [],          // string[]
  onValueChange,       // (string[]) => void
  placeholder = 'Select...',
  otherValue = '',     // controlled value for the "Other" text input
  onOtherChange,       // (string) => void
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const hasOther = value.includes('Other');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optValue) => {
    const next = value.includes(optValue)
      ? value.filter(v => v !== optValue)
      : [...value, optValue];
    onValueChange?.(next);
  };

  const removeOption = (optValue, e) => {
    e.stopPropagation();
    onValueChange?.(value.filter(v => v !== optValue));
  };

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const getLabel = (val) => options.find(o => o.value === val)?.label ?? val;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          open && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        {/* Selected tags or placeholder */}
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            value.map(val => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                {getLabel(val)}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onMouseDown={(e) => removeOption(val, e)}
                />
              </span>
            ))
          )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search components..."
              className="w-full rounded-sm border border-input bg-background px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                No results found.
              </li>
            ) : (
              filtered.map(opt => {
                const selected = value.includes(opt.value);
                return (
                  <li
                    key={opt.value}
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent input blur
                      toggleOption(opt.value);
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none',
                      'hover:bg-accent hover:text-accent-foreground',
                      selected && 'font-medium'
                    )}
                  >
                    <div className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary',
                      selected ? 'bg-primary text-primary-foreground' : 'opacity-50'
                    )}>
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    {opt.label}
                  </li>
                );
              })
            )}
          </ul>

          {/* "Other" text input — only shown when Other is selected */}
          {hasOther && (
            <div className="p-2 border-t border-border">
              <Input
                autoFocus={false}
                type="text"
                value={otherValue}
                onChange={e => onOtherChange?.(e.target.value)}
                placeholder="Specify other component..."
                className="text-sm"
                onMouseDown={e => e.stopPropagation()} // don't close dropdown
              />
            </div>
          )}

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-border text-xs text-muted-foreground">
            {value.length} selected — click outside to close
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;