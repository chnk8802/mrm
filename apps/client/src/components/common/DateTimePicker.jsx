import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

const DateTimePicker = ({
  label,
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled,
  disabledDates,
  className = "",
}) => {
  const handleDateSelect = (date) => {
    if (!date) return;
    const next = new Date(date);
    if (value) {
      next.setHours(value.getHours(), value.getMinutes());
    } else {
      const now = new Date();
      next.setHours(now.getHours(), now.getMinutes());
    }
    onChange(next);
  };

  // derive current 12h display values from the stored 24h Date
  const base = value || new Date();
  const hour24 = base.getHours();
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = String(hour24 % 12 === 0 ? 12 : hour24 % 12).padStart(2, "0");
  const minute = String(base.getMinutes()).padStart(2, "0");

  const applyTime = (nextHour12, nextMinute, nextPeriod) => {
    let h = parseInt(nextHour12, 10) % 12;
    if (nextPeriod === "PM") h += 12;
    const next = new Date(value || new Date());
    next.setHours(h, parseInt(nextMinute, 10));
    onChange(next);
  };

  return (
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
            onSelect={handleDateSelect}
            disabled={disabledDates}
            initialFocus
          />
          <div className="border-t border-border p-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />

            <Select
              value={hour12}
              onValueChange={(v) => applyTime(v, minute, period)}
            >
              <SelectTrigger className="h-8 text-xs w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={h} className="text-xs">
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-muted-foreground text-xs">:</span>

            <Select
              value={minute}
              onValueChange={(v) => applyTime(hour12, v, period)}
            >
              <SelectTrigger className="h-8 text-xs w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={period}
              onValueChange={(v) => applyTime(hour12, minute, v)}
            >
              <SelectTrigger className="h-8 text-xs w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM" className="text-xs">
                  AM
                </SelectItem>
                <SelectItem value="PM" className="text-xs">
                  PM
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateTimePicker;
