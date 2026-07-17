// components/ThemeSelector.jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const DESIGN_THEMES = [
  { value: 'default', label: 'Default', sub: 'Indigo minimal', dot: 'bg-indigo-500' },
  { value: 'workshop', label: 'Workshop', sub: 'Emerald green', dot: 'bg-emerald-500' },
  { value: 'ocean', label: 'Ocean', sub: 'Deep blue', dot: 'bg-blue-500' },
  { value: 'cyberpunk', label: 'Cyberpunk', sub: 'Neon pink', dot: 'bg-pink-500' },
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
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${preset.dot}`} />
            <span className="">
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