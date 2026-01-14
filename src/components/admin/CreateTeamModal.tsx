import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTeams, type Team } from "@/hooks/useTeams";

const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(50, "Team name must be 50 characters or less")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be 50 characters or less"),
  description: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional(),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated: (team: Team) => void;
}

export function CreateTeamModal({
  open,
  onOpenChange,
  onTeamCreated,
}: CreateTeamModalProps) {
  const { createTeam } = useTeams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
    },
  });

  const descriptionValue = watch("description") || "";

  const onSubmit = async (data: CreateTeamFormData) => {
    setIsSubmitting(true);
    try {
      const newTeam = await createTeam.mutateAsync({
        name: data.name,
        display_name: data.display_name,
        description: data.description,
      });
      reset();
      onTeamCreated(newTeam);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Add a new team category for organizing your plays.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="team-name" className="text-sm font-semibold">
              Team Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team-name"
              placeholder="e.g., Marketing"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-display-name" className="text-sm font-semibold">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team-display-name"
              placeholder="e.g., Marketing Team"
              {...register("display_name")}
              className={errors.display_name ? "border-destructive" : ""}
            />
            {errors.display_name && (
              <p className="text-xs text-destructive">
                {errors.display_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description" className="text-sm font-semibold">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="team-description"
              placeholder="Brief description of this team's responsibilities"
              rows={2}
              {...register("description")}
              className={`resize-none ${errors.description ? "border-destructive" : ""}`}
            />
            <div className="flex justify-end">
              <p className="text-xs text-muted-foreground">
                {descriptionValue.length}/200
              </p>
            </div>
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
