
"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format, type DateRange } from "date-fns"
import { es } from 'date-fns/locale';


import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.ComponentProps<typeof PopoverTrigger> {
  initialDateFrom?: Date;
  initialDateTo?: Date;
  onUpdate?: (values: { range: DateRange; rangeCompare?: DateRange }) => void;
  align?: "start" | "center" | "end";
  locale?: Locale; // Using Locale type from date-fns
  showCompare?: boolean;
  className?: string; // Added className to DateRangePickerProps
}


export function DateRangePicker({
  className,
  initialDateFrom,
  initialDateTo,
  onUpdate,
  align = "end",
  locale = es, // Default to Spanish locale
  showCompare = false,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (initialDateFrom && initialDateTo) {
      return { from: initialDateFrom, to: initialDateTo };
    }
    if (initialDateFrom) {
      return { from: initialDateFrom, to: initialDateFrom };
    }
    return undefined;
  });
  
  React.useEffect(() => {
    if (initialDateFrom && initialDateTo) {
      setDate({ from: initialDateFrom, to: initialDateTo });
    } else if (initialDateFrom) {
       setDate({ from: initialDateFrom, to: initialDateFrom });
    } else {
      setDate(undefined);
    }
  }, [initialDateFrom, initialDateTo]);


  const [compareDate, setCompareDate] = React.useState<DateRange | undefined>(
    undefined
  )

  const getDislayRange = (dateRange: DateRange | undefined) => {
    if (!dateRange?.from) {
      return "Seleccionar rango"
    }
    if (dateRange.to) {
      return `${format(dateRange.from, "LLL dd, y", { locale })} - ${format(
        dateRange.to,
        "LLL dd, y",
        { locale }
      )}`
    }
    return format(dateRange.from, "LLL dd, y", { locale })
  }

  const handleUpdate = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (onUpdate && newDate) {
      onUpdate({ range: newDate, rangeCompare: compareDate });
    }
  }
  
  const handleCompareUpdate = (newCompareDate: DateRange | undefined) => {
    setCompareDate(newCompareDate);
     if (onUpdate && date) {
      onUpdate({ range: date, rangeCompare: newCompareDate });
    }
  }


  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDislayRange(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleUpdate}
            numberOfMonths={2}
            locale={locale}
          />
          {showCompare && (
            <>
            <div className="p-2 pt-0">
              <hr className="mb-2"/>
               <label className="text-sm font-medium">Comparar con:</label>
            </div>
            <Calendar
                initialFocus
                mode="range"
                defaultMonth={compareDate?.from}
                selected={compareDate}
                onSelect={handleCompareUpdate}
                numberOfMonths={2}
                locale={locale}
            />
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
