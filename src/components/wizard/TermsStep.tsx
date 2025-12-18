import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useWorkstreamWizard } from "@/contexts/WorkstreamWizardContext";

interface CommercialTerms {
  annual_contract_value: number | null;
  payment_terms: string;
  custom_payment_terms?: string;
  start_date: string | null;
  end_date: string | null;
  discount_percentage: number | null;
}

const PAYMENT_TERMS_OPTIONS = [
  { value: "net_30", label: "Net 30" },
  { value: "net_60", label: "Net 60" },
  { value: "net_90", label: "Net 90" },
  { value: "custom", label: "Custom" },
];

export function TermsStep() {
  const { state, setCommercialTerms } = useWorkstreamWizard();
  
  const existingTerms = state.commercial_terms as unknown as CommercialTerms | null;
  
  const [acv, setAcv] = useState<string>(
    existingTerms?.annual_contract_value?.toString() || ""
  );
  const [paymentTerms, setPaymentTerms] = useState(
    existingTerms?.payment_terms || "net_30"
  );
  const [customPaymentTerms, setCustomPaymentTerms] = useState(
    existingTerms?.custom_payment_terms || ""
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    existingTerms?.start_date ? new Date(existingTerms.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    existingTerms?.end_date ? new Date(existingTerms.end_date) : undefined
  );
  const [discount, setDiscount] = useState<string>(
    existingTerms?.discount_percentage?.toString() || ""
  );

  // Sync with wizard state on changes
  useEffect(() => {
    const terms: Record<string, unknown> = {
      annual_contract_value: acv ? parseFloat(acv) : null,
      payment_terms: paymentTerms,
      ...(paymentTerms === "custom" && { custom_payment_terms: customPaymentTerms }),
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      discount_percentage: discount ? parseFloat(discount) : null,
    };
    setCommercialTerms(terms);
  }, [acv, paymentTerms, customPaymentTerms, startDate, endDate, discount, setCommercialTerms]);

  const handleAcvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAcv(value);
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const numValue = parseFloat(value);
    if (value === "" || (numValue >= 0 && numValue <= 100)) {
      setDiscount(value);
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return "";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString("en-US");
  };

  const dateError = startDate && endDate && startDate > endDate;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Define the commercial details of this deal.
        </p>
      </div>

      <div className="space-y-6">
        {/* Annual Contract Value */}
        <div className="space-y-2">
          <Label htmlFor="acv" className="text-base font-medium">
            Annual Contract Value <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="acv"
              type="text"
              value={formatCurrency(acv)}
              onChange={handleAcvChange}
              placeholder="0"
              className="pl-7"
            />
          </div>
        </div>

        {/* Payment Terms */}
        <div className="space-y-2">
          <Label htmlFor="payment-terms" className="text-base font-medium">
            Payment Terms <span className="text-destructive">*</span>
          </Label>
          <Select value={paymentTerms} onValueChange={setPaymentTerms}>
            <SelectTrigger id="payment-terms">
              <SelectValue placeholder="Select payment terms" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TERMS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {paymentTerms === "custom" && (
            <Input
              value={customPaymentTerms}
              onChange={(e) => setCustomPaymentTerms(e.target.value)}
              placeholder="Enter custom payment terms"
              className="mt-2"
            />
          )}
        </div>

        {/* Contract Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Contract Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Contract End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                    dateError && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => startDate ? date < startDate : false}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {dateError && (
              <p className="text-sm text-destructive">
                End date must be after start date
              </p>
            )}
          </div>
        </div>

        {/* Discount */}
        <div className="space-y-2">
          <Label htmlFor="discount" className="text-base font-medium">
            Discount
          </Label>
          <div className="relative max-w-[150px]">
            <Input
              id="discount"
              type="text"
              value={discount}
              onChange={handleDiscountChange}
              placeholder="0"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              %
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Optional discount percentage (0-100)
          </p>
        </div>
      </div>
    </div>
  );
}
