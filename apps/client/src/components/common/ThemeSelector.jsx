// components/common/ThemeSelector.jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const DESIGN_THEMES = [
  { value: 'default', label: 'Ohmic', sub: 'Black & red', swatch: 'linear-gradient(135deg, #111111 50%, #a80000 50%)' },
  { value: 'indigo', label: 'Indigo', sub: 'Minimal violet', swatch: '#4f46e5' },
  { value: 'workshop', label: 'Workshop', sub: 'Emerald green', swatch: '#15803d' },
  { value: 'ocean', label: 'Ocean', sub: 'Deep blue', swatch: '#2563eb' },
];

const ThemeSelector = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="mt-1 h-9 text-sm">
      <SelectValue placeholder="Select theme" />
    </SelectTrigger>
    <SelectContent>
      {DESIGN_THEMES.map((preset) => (
        <SelectItem key={preset.value} value={preset.value} className="text-sm">
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 border border-border"
              style={{ background: preset.swatch }}
            />
            <span>
              <span>{preset.label} </span>
              <span className="text-muted-foreground">({preset.sub})</span>
            </span>
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default ThemeSelector;