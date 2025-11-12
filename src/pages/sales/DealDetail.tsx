import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Edit, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function ContractDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-semibold">Acme Corp Enterprise Agreement</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="bg-status-warning/10 text-status-warning border-status-warning/20">
              Pending Signature
            </Badge>
            <span className="text-sm text-muted-foreground">Created Oct 15, 2024</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Business Overview</TabsTrigger>
          <TabsTrigger value="legal">Legal Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks & Workflow</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-xl">Business Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Business Objective</div>
                  <div className="text-base font-medium">New Customer Acquisition</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Expected Annual Value</div>
                  <div className="text-base font-medium">$500,000 ARR</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Strategic Priority</div>
                  <div className="text-base font-medium">High</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Created By</div>
                  <div className="text-base font-medium">John Smith</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-xl">Key Business Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Pricing Model</div>
                  <div className="text-base font-medium">Per-seat subscription</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Price</div>
                  <div className="text-base font-medium">$42/user/month (1,000 seats)</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Payment Terms</div>
                  <div className="text-base font-medium">Annual upfront</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Contract Duration</div>
                  <div className="text-base font-medium">1 year (auto-renews)</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">SLA</div>
                  <div className="text-base font-medium">99.9% uptime, &lt;2hr P1 response</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-xl">Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Your Company</div>
                  <div className="text-base font-medium">TechCo Inc.</div>
                  <div className="text-sm text-muted-foreground mt-1">John Smith, CEO</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Counter-party</div>
                  <div className="text-base font-medium">Acme Corp</div>
                  <div className="text-sm text-muted-foreground mt-1">Jane Doe, CTO</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-xl">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">Oct 15, 2024</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Sent for signature</span>
                  <span className="font-medium">Oct 18, 2024</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Expected close</span>
                  <span className="font-medium">Nov 1, 2024</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Contract start</span>
                  <span className="font-medium">Nov 1, 2024</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">First renewal</span>
                  <span className="font-medium">Nov 1, 2025</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <Card className="border border-border">
            <CardContent className="p-8">
              <p className="text-muted-foreground">Legal details view - coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="border border-border">
            <CardContent className="p-8">
              <p className="text-muted-foreground">Tasks view - coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="border border-border">
            <CardContent className="p-8">
              <p className="text-muted-foreground">Documents view - coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
