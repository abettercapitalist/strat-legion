import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Check, X, MessageSquare } from "lucide-react";
import { useState } from "react";

const requests = [
  {
    id: "1",
    date: "2025-11-10",
    template: "Enterprise SaaS Agreement",
    clause: "4.2 - Payment Terms",
    requestedBy: "Sales",
    changeType: "Add Alternative",
    status: "Pending",
    justification: "Customer requests Net 90 payment terms. Used in 40% of enterprise deals.",
    currentText: "Customer shall pay all fees within Net 30 days of invoice date.",
    proposedText: "Customer shall pay all fees within Net 90 days of invoice date.",
  },
  {
    id: "2",
    date: "2025-11-08",
    template: "Framework Agreement",
    clause: "8.1 - Limitation of Liability",
    requestedBy: "Sales",
    changeType: "Modify Standard",
    status: "Pending",
    justification: "Strategic customer requires 2x liability cap instead of 1x annual fees.",
    currentText: "Liability shall be limited to fees paid in the prior 12 months.",
    proposedText: "Liability shall be limited to 2x fees paid in the prior 12 months.",
  },
  {
    id: "3",
    date: "2025-11-05",
    template: "Professional Services Agreement",
    clause: "10.1 - Termination Rights",
    requestedBy: "Finance",
    changeType: "Update Context",
    status: "Pending",
    justification: "Need to clarify termination notice period for project-based work.",
    currentText: "Either party may terminate with 30 days written notice.",
    proposedText: "Either party may terminate with 60 days written notice for ongoing projects, 30 days for completed milestones.",
  },
];

const statuses = ["All", "Pending", "Approved", "Rejected"];
const teams = ["All", "Sales", "Finance", "Pro Services"];

export default function ChangeRequests() {
  const [selectedRequest, setSelectedRequest] = useState(requests[0]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Change Requests</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve proposed changes to templates and clauses
          </p>
        </div>
        <Badge className="text-base px-4 py-2 bg-destructive text-destructive-foreground">
          3 Pending
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search requests..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          {statuses.map((status) => (
            <Button
              key={status}
              variant={status === "Pending" ? "default" : "outline"}
              size="sm"
            >
              {status}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {teams.map((team) => (
            <Button
              key={team}
              variant={team === "All" ? "default" : "outline"}
              size="sm"
            >
              {team}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Request List */}
        <div className="space-y-3">
          {requests.map((request) => (
            <Card
              key={request.id}
              className={`cursor-pointer transition-all ${
                selectedRequest.id === request.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              }`}
              onClick={() => setSelectedRequest(request)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {request.date}
                  </span>
                  <Badge variant="outline" className="bg-status-warning/10 text-status-warning border-status-warning/20">
                    {request.status}
                  </Badge>
                </div>
                <h3 className="font-medium text-sm">{request.template}</h3>
                <p className="text-xs text-muted-foreground">{request.clause}</p>
                <div className="flex gap-2 pt-1">
                  <Badge variant="outline" className="bg-muted text-xs">
                    {request.requestedBy}
                  </Badge>
                  <Badge variant="outline" className="bg-muted text-xs">
                    {request.changeType}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Request Detail */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-2xl font-semibold">{selectedRequest.template}</h2>
                  <Badge variant="outline" className="bg-status-warning/10 text-status-warning border-status-warning/20">
                    {selectedRequest.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{selectedRequest.clause}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="bg-muted">
                    {selectedRequest.requestedBy}
                  </Badge>
                  <Badge variant="outline" className="bg-muted">
                    {selectedRequest.changeType}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{selectedRequest.date}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Justification</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedRequest.justification}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-medium">Current Text</h3>
                  <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed">
                    {selectedRequest.currentText}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Proposed Text</h3>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm leading-relaxed">
                    {selectedRequest.proposedText}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Review Notes</h3>
                <Textarea
                  placeholder="Add your review comments..."
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Request Discussion
                </Button>
                <Button variant="outline" className="flex-1 text-destructive hover:text-destructive">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
