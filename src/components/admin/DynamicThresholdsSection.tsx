import { Plus, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DynamicThreshold,
  DYNAMIC_METRIC_OPTIONS,
  DYNAMIC_OPERATOR_OPTIONS,
} from "@/types/autoApproval";

interface DynamicThresholdsSectionProps {
  thresholds: DynamicThreshold[];
  onThresholdsChange: (thresholds: DynamicThreshold[]) => void;
}

export function DynamicThresholdsSection({
  thresholds,
  onThresholdsChange,
}: DynamicThresholdsSectionProps) {
  const addThreshold = () => {
    const newThreshold: DynamicThreshold = {
      metric: 'contract_value',
      operator: 'greater_than',
      value: 100000,
      adjustment: -5,
    };
    onThresholdsChange([...thresholds, newThreshold]);
  };

  const removeThreshold = (index: number) => {
    onThresholdsChange(thresholds.filter((_, i) => i !== index));
  };

  const updateThreshold = (index: number, updates: Partial<DynamicThreshold>) => {
    const newThresholds = thresholds.map((t, i) =>
      i === index ? { ...t, ...updates } : t
    );
    onThresholdsChange(newThresholds);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  };

  const getMetricUnit = (metric: string) => {
    if (metric === 'duration_years') return 'years';
    return '$';
  };

  return (
    <div className="space-y-3 pt-3 border-t">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Dynamic Adjustments</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Automatically adjust thresholds based on deal characteristics
      </p>

      {thresholds.length > 0 && (
        <div className="space-y-3">
          {thresholds.map((threshold, index) => (
            <div
              key={index}
              className="flex flex-wrap items-start gap-2 p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">When</span>
                <Select
                  value={threshold.metric}
                  onValueChange={(value) =>
                    updateThreshold(index, {
                      metric: value as DynamicThreshold['metric'],
                    })
                  }
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DYNAMIC_METRIC_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">is</span>
                <Select
                  value={threshold.operator}
                  onValueChange={(value) =>
                    updateThreshold(index, {
                      operator: value as DynamicThreshold['operator'],
                    })
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DYNAMIC_OPERATOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  {threshold.operator === 'between' ? 'from' : 'value'}
                </span>
                <div className="relative">
                  {getMetricUnit(threshold.metric) === '$' && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      $
                    </span>
                  )}
                  <Input
                    type="text"
                    value={
                      getMetricUnit(threshold.metric) === '$'
                        ? formatCurrency(threshold.value)
                        : threshold.value
                    }
                    onChange={(e) =>
                      updateThreshold(index, {
                        value:
                          getMetricUnit(threshold.metric) === '$'
                            ? parseCurrency(e.target.value)
                            : parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className={`w-28 h-8 text-xs ${
                      getMetricUnit(threshold.metric) === '$' ? 'pl-5' : ''
                    }`}
                  />
                </div>
              </div>

              {threshold.operator === 'between' && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">to</span>
                  <div className="relative">
                    {getMetricUnit(threshold.metric) === '$' && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        $
                      </span>
                    )}
                    <Input
                      type="text"
                      value={
                        getMetricUnit(threshold.metric) === '$'
                          ? formatCurrency(threshold.value_max || 0)
                          : threshold.value_max || 0
                      }
                      onChange={(e) =>
                        updateThreshold(index, {
                          value_max:
                            getMetricUnit(threshold.metric) === '$'
                              ? parseCurrency(e.target.value)
                              : parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className={`w-28 h-8 text-xs ${
                        getMetricUnit(threshold.metric) === '$' ? 'pl-5' : ''
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">adjust by</span>
                <div className="relative">
                  <Input
                    type="number"
                    value={threshold.adjustment}
                    onChange={(e) =>
                      updateThreshold(index, {
                        adjustment: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-20 h-8 text-xs pr-5"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeThreshold(index)}
                className="h-8 w-8 mt-4 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addThreshold}
        className="gap-1"
      >
        <Plus className="h-3 w-3" />
        Add Dynamic Rule
      </Button>

      {thresholds.length > 0 && (
        <p className="text-xs text-muted-foreground italic">
          Example: "When Contract Value is greater than $500,000, adjust discount threshold by -5%"
          means max discount allowed decreases by 5 percentage points for large deals.
        </p>
      )}
    </div>
  );
}
