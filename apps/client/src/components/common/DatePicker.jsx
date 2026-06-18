import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

const DatePicker = ({ label, value, onChange, placeholder = 'Pick a date', disabled, disabledDates, className = '' }) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    {label && <Label className="text-xs font-medium text-muted-foreground">{label}</Label>}
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={`h-9 w-full justify-start text-sm font-normal ${!value ? 'text-muted-foreground' : ''}`}
        >
          <CalendarIcon className="w-3.5 h-3.5 mr-2 shrink-0 text-muted-foreground" />
          {value ? format(value, 'dd MMM yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => date && onChange(date)}
          disabled={disabledDates}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </div>
);

export default DatePicker;