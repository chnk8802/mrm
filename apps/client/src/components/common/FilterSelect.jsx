import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const FilterSelect = ({ label, value, onChange, options, allLabel = 'All' }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{label}</p>
    <Select value={value || '__all__'} onValueChange={(v) => onChange(v === '__all__' ? '' : v)}>
      <SelectTrigger className="w-full h-8 text-sm">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__" className="text-sm">{allLabel}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default FilterSelect;