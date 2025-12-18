import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type ApprovalWithDetails = {
  id: string;
  status: string | null;
  current_gate: number | null;
  submitted_at: string | null;
  created_at: string;
  workstream: {
    id: string;
    name: string;
    business_objective: string | null;
    counterparty: {
      name: string;
    } | null;
  } | null;
  approval_template: {
    name: string;
    approval_sequence: unknown;
  } | null;
};

export default function MatterReview() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: approvals, isLoading } = useQuery({
    queryKey: ["law-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstream_approvals")
        .select(`
          id,
          status,
          current_gate,
          submitted_at,
          created_at,
          workstream:workstreams(
            id,
            name,
            business_objective,
            counterparty:counterparties(name)
          ),
          approval_template:approval_templates(name, approval_sequence)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ApprovalWithDetails[];
    },
  });

  const pendingApprovals = approvals?.filter(a => a.status === "pending") || [];
  const completedApprovals = approvals?.filter(a => a.status === "approved") || [];
  const rejectedApprovals = approvals?.filter(a => a.status === "rejected") || [];

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const renderApprovalCard = (approval: ApprovalWithDetails) => (
    <Card 
      key={approval.id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => approval.workstream && navigate(`/law/matters/${approval.workstream.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">
              {approval.workstream?.name || "Unknown Matter"}
            </CardTitle>
            {approval.workstream?.counterparty && (
              <p className="text-sm text-muted-foreground">
                {approval.workstream.counterparty.name}
              </p>
            )}
          </div>
          {getStatusBadge(approval.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          {getStatusIcon(approval.status)}
          <span className="text-muted-foreground">
            {approval.approval_template?.name || "Approval Route"}
          </span>
        </div>
        {approval.submitted_at && (
          <p className="text-sm text-muted-foreground">
            Submitted {formatDistanceToNow(new Date(approval.submitted_at), { addSuffix: true })}
          </p>
        )}
        {approval.workstream?.business_objective && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {approval.workstream.business_objective}
          </p>
        )}
        <Button variant="outline" size="sm" className="w-full">
          Review Details
        </Button>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (message: string) => (
    <Card className="p-12 text-center">
      <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{message}</h3>
      <p className="text-muted-foreground">
        When matters require your review, they will appear here.
      </p>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Matter Review</h1>
        <p className="text-muted-foreground">
          Review and approve pending matters
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{pendingApprovals.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{completedApprovals.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{rejectedApprovals.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingApprovals.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="pending" className="mt-6">
              {pendingApprovals.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingApprovals.map(renderApprovalCard)}
                </div>
              ) : (
                renderEmptyState("No pending reviews")
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {completedApprovals.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedApprovals.map(renderApprovalCard)}
                </div>
              ) : (
                renderEmptyState("No approved matters yet")
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {rejectedApprovals.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rejectedApprovals.map(renderApprovalCard)}
                </div>
              ) : (
                renderEmptyState("No rejected matters")
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
