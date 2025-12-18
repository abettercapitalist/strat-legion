import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

const counterpartyTypes = [
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "partner", label: "Partner" },
  { value: "prospect", label: "Prospect" },
  { value: "subcontractor", label: "Subcontractor" },
];

interface CreateCounterpartyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string, name: string) => void;
}

export function CreateCounterpartyModal({
  open,
  onOpenChange,
  onCreated,
}: CreateCounterpartyModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    counterparty_type: "customer",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("counterparties")
        .insert({
          name: formData.name,
          counterparty_type: formData.counterparty_type,
          primary_contact_name: formData.primary_contact_name || null,
          primary_contact_email: formData.primary_contact_email || null,
          primary_contact_phone: formData.primary_contact_phone || null,
          relationship_status: "prospect",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["counterparties"] });
      toast.success("Counterparty created");
      onCreated(data.id, data.name);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create counterparty");
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      counterparty_type: "customer",
      primary_contact_name: "",
      primary_contact_email: "",
      primary_contact_phone: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Counterparty</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.counterparty_type}
              onValueChange={(value) =>
                setFormData({ ...formData, counterparty_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {counterpartyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              value={formData.primary_contact_name}
              onChange={(e) =>
                setFormData({ ...formData, primary_contact_name: e.target.value })
              }
              placeholder="John Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.primary_contact_email}
              onChange={(e) =>
                setFormData({ ...formData, primary_contact_email: e.target.value })
              }
              placeholder="john@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.primary_contact_phone}
              onChange={(e) =>
                setFormData({ ...formData, primary_contact_phone: e.target.value })
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create & Select"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
