import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DatePicker = ({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  disabledDates,
  className = "",
}) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    {label && (
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
    )}
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-8 w-full items-center justify-start rounded-md border border-input bg-transparent px-2.5 text-sm shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
            "data-[state=open]:ring-2 data-[state=open]:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5 mr-2 shrink-0 text-muted-foreground" />
          {value ? format(value, "dd MMM yyyy, hh:mm a") : placeholder}
        </button>
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
