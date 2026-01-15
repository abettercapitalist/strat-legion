import { Plus, X, Settings2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
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
import { CustomStandard, CUSTOM_STANDARD_OPERATOR_OPTIONS } from "@/types/autoApproval";

interface CustomStandardsSectionProps {
  standards: CustomStandard[];
  onStandardsChange: (standards: CustomStandard[]) => void;
}

export function CustomStandardsSection({
  standards,
  onStandardsChange,
}: CustomStandardsSectionProps) {
  const addStandard = () => {
    const newStandard: CustomStandard = {
      id: uuidv4(),
      name: "",
      operator: "less_than",
      value: 0,
    };
    onStandardsChange([...standards, newStandard]);
  };

  const removeStandard = (id: string) => {
    onStandardsChange(standards.filter((s) => s.id !== id));
  };

  const updateStandard = (id: string, updates: Partial<CustomStandard>) => {
    onStandardsChange(
      standards.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const parseNumber = (value: string): number => {
    return parseInt(value.replace(/,/g, ""), 10) || 0;
  };

  return (
    <div className="space-y-3 pt-3 border-t">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Custom Standards</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Define additional business-specific criteria for auto-approval
      </p>

      {standards.length > 0 && (
        <div className="space-y-3">
          {standards.map((standard) => (
            <div
              key={standard.id}
              className="flex flex-wrap items-start gap-2 p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Name</span>
                <Input
                  type="text"
                  placeholder="e.g., Annual Value"
                  value={standard.name}
                  onChange={(e) =>
                    updateStandard(standard.id, { name: e.target.value })
                  }
                  className="w-40 h-8 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Condition</span>
                <Select
                  value={standard.operator}
                  onValueChange={(value) =>
                    updateStandard(standard.id, {
                      operator: value as CustomStandard["operator"],
                    })
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_STANDARD_OPERATOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  {standard.operator === "between" ? "From" : "Value"}
                </span>
                <Input
                  type="text"
                  value={formatNumber(standard.value)}
                  onChange={(e) =>
                    updateStandard(standard.id, {
                      value: parseNumber(e.target.value),
                    })
                  }
                  className="w-28 h-8 text-xs"
                />
              </div>

              {standard.operator === "between" && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">To</span>
                  <Input
                    type="text"
                    value={formatNumber(standard.value_max || 0)}
                    onChange={(e) =>
                      updateStandard(standard.id, {
                        value_max: parseNumber(e.target.value),
                      })
                    }
                    className="w-28 h-8 text-xs"
                  />
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStandard(standard.id)}
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
        onClick={addStandard}
        className="gap-1"
      >
        <Plus className="h-3 w-3" />
        Add Custom Standard
      </Button>

      {standards.length > 0 && (
        <p className="text-xs text-muted-foreground italic">
          Custom standards extend tier-based rules with your specific business requirements.
        </p>
      )}
    </div>
  );
}
