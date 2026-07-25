import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, } from '@/components/ui/command'; import { cn } from '@/lib/utils';

export const AsyncCombobox = ({ value, onChange, fetchOptions, placeholder = 'Search...', error, initialLabel, onCreateNew, createLabel = 'Create new', }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef(null);

  // Sync from value + initialLabel on mount (edit forms)
  useEffect(() => {
    if (value && initialLabel && !selected) {
      setSelected({ value, label: initialLabel });
    }
  }, [value, initialLabel]);

  // Clear selected when value is reset externally
  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  // Fetch on query/open change
  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchOptions(query);
        setOptions(results);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, fetchOptions]);

  const handleSelect = (opt) => {
    setSelected(opt);
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelected(null);
    onChange('');
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full h-8 justify-between px-2.5 font-normal text-sm',
            !selected && 'text-muted-foreground',
            error && 'border-red-500 focus-visible:ring-red-500'
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <span className="flex items-center gap-1 shrink-0 ml-2">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={e => e.key === 'Enter' && handleClear(e)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
            className="h-8 text-sm"
          />
          <CommandList>
            {loading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
            ) : (
              <>
                <CommandEmpty className="px-3 py-2 text-xs text-muted-foreground">
                  {query ? 'No results found' : 'Start typing to search'}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.value}
                      onSelect={() => handleSelect(opt)}
                      className="text-sm"
                    >
                      <Check className={cn(
                        'mr-2 w-3.5 h-3.5 shrink-0',
                        selected?.value === opt.value ? 'opacity-100' : 'opacity-0'
                      )} />
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {onCreateNew && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => { setOpen(false); onCreateNew(query); }}
                      className="text-sm text-primary gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      {query ? `${createLabel} "${query}"` : createLabel}
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};