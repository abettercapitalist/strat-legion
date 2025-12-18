import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Workstream {
  id: string;
  name: string;
  stage: string | null;
  tier: string | null;
  business_objective: string | null;
  annual_value: number | null;
  notes: string | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  created_at: string;
  updated_at: string;
  counterparty: {
    id: string;
    name: string;
    counterparty_type: string | null;
    entity_type: string | null;
    primary_contact_name: string | null;
    primary_contact_email: string | null;
    address: string | null;
  } | null;
  workstream_type: {
    id: string;
    name: string;
    display_name: string | null;
    description: string | null;
  } | null;
}

interface WorkstreamOverviewTabProps {
  workstream: Workstream;
  module: "law" | "sales";
}

export function WorkstreamOverviewTab({ workstream, module }: WorkstreamOverviewTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Business Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Business Objective</p>
              <p className="font-medium">{workstream.business_objective || "Not specified"}</p>
            </div>
            {workstream.annual_value && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Annual Value</p>
                <p className="font-medium">{formatCurrency(workstream.annual_value)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">{module === "sales" ? "Deal" : "Matter"} Type</p>
              <p className="font-medium">
                {workstream.workstream_type?.display_name || workstream.workstream_type?.name || "Not specified"}
              </p>
            </div>
            {workstream.tier && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tier</p>
                <p className="font-medium capitalize">{workstream.tier}</p>
              </div>
            )}
          </div>
          {workstream.notes && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{workstream.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Counterparty */}
      {workstream.counterparty && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Counterparty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{workstream.counterparty.name}</p>
              </div>
              {workstream.counterparty.counterparty_type && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type</p>
                  <p className="font-medium capitalize">{workstream.counterparty.counterparty_type}</p>
                </div>
              )}
              {workstream.counterparty.entity_type && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Entity Type</p>
                  <p className="font-medium">{workstream.counterparty.entity_type}</p>
                </div>
              )}
              {workstream.counterparty.primary_contact_name && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Primary Contact</p>
                  <p className="font-medium">{workstream.counterparty.primary_contact_name}</p>
                  {workstream.counterparty.primary_contact_email && (
                    <p className="text-sm text-muted-foreground">{workstream.counterparty.primary_contact_email}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{format(new Date(workstream.created_at), "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">{format(new Date(workstream.updated_at), "MMM d, yyyy")}</span>
            </div>
            {workstream.expected_close_date && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Expected Close</span>
                <span className="font-medium">{format(new Date(workstream.expected_close_date), "MMM d, yyyy")}</span>
              </div>
            )}
            {workstream.actual_close_date && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Actual Close</span>
                <span className="font-medium">{format(new Date(workstream.actual_close_date), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}