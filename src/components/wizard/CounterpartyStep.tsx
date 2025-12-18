import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Building2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWorkstreamWizard } from "@/contexts/WorkstreamWizardContext";
import { CreateCounterpartyModal } from "./CreateCounterpartyModal";

interface Counterparty {
  id: string;
  name: string;
  counterparty_type: string | null;
  relationship_status: string | null;
  entity_type: string | null;
}

interface CounterpartyStepProps {
  itemName: string;
}

export function CounterpartyStep({ itemName }: CounterpartyStepProps) {
  const { state, setCounterparty } = useWorkstreamWizard();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch counterparties
  const { data: counterparties, isLoading } = useQuery({
    queryKey: ["counterparties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counterparties")
        .select("id, name, counterparty_type, relationship_status, entity_type")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Counterparty[];
    },
  });

  // Filter counterparties based on search
  const filteredCounterparties = useMemo(() => {
    if (!counterparties) return [];
    if (!searchQuery.trim()) return counterparties.slice(0, 10);

    const query = searchQuery.toLowerCase();
    return counterparties.filter((cp) =>
      cp.name.toLowerCase().includes(query)
    );
  }, [counterparties, searchQuery]);

  const handleSelect = (cp: Counterparty) => {
    setCounterparty(cp.id, cp.name);
  };

  const handleCreated = (id: string, name: string) => {
    setCounterparty(id, name);
  };

  const formatType = (type: string | null) => {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatStatus = (status: string | null) => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Who is this {itemName.toLowerCase()} with?
        </h2>
        <p className="text-muted-foreground mt-1">
          Select an existing counterparty or create a new one
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Counterparty list */}
      <div className="space-y-2">
        {!searchQuery && (
          <p className="text-sm text-muted-foreground mb-3">Recent counterparties:</p>
        )}

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!isLoading && filteredCounterparties.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No counterparties found" : "No counterparties yet"}
          </div>
        )}

        {!isLoading && filteredCounterparties.map((cp) => {
          const isSelected = state.counterparty_id === cp.id;

          return (
            <button
              key={cp.id}
              type="button"
              onClick={() => handleSelect(cp)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-full",
                  isSelected ? "bg-primary" : "bg-muted"
                )}
              >
                {isSelected ? (
                  <Check className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{cp.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[
                    formatType(cp.counterparty_type),
                    cp.entity_type,
                    formatStatus(cp.relationship_status),
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>

              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Create new button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowCreateModal(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New Counterparty
      </Button>

      <CreateCounterpartyModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={handleCreated}
      />
    </div>
  );
}
