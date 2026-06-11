import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export const AsyncCombobox = ({ value, onChange, fetchOptions, placeholder, error, initialLabel }) => {
  const [query, setQuery]       = useState('');
  const [options, setOptions]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);
  const debounceRef             = useRef(null);
  const containerRef            = useRef(null);

  // ── Sync from value + initialLabel on mount (edit forms) ──────────────────
  useEffect(() => {
    if (value && initialLabel && !selected) {
      setSelected({ value, label: initialLabel });
    }
  }, [value, initialLabel]);

  // ── Clear selected when value is reset to empty externally ────────────────
  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch on query change ──────────────────────────────────────────────────
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
  }, [query, open]);

  const handleSelect = (opt) => {
    setSelected(opt);
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center h-8 rounded-md border bg-background px-2 gap-1.5 text-sm ${error ? 'border-red-500' : 'border-input'}`}>
        {selected ? (
          <>
            <span className="flex-1 truncate text-sm">{selected.label}</span>
            <button type="button" onClick={handleClear}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              placeholder={placeholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
            />
          </>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <p className="text-xs text-muted-foreground px-3 py-2">Searching...</p>
          ) : options.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">
              {query ? 'No results found' : 'Start typing to search'}
            </p>
          ) : (
            <ul className="max-h-48 overflow-y-auto">
              {options.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};