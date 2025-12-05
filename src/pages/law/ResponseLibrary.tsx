import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, MessageSquare } from "lucide-react";
import { useState } from "react";

// Placeholder data - to be developed
const responses = [
  {
    id: "1",
    title: "Extended Payment Terms Request",
    category: "Pricing",
    successRate: 85,
    timesUsed: 24,
    summary: "Standard response for Net 60/90 payment term requests",
  },
  {
    id: "2",
    title: "Liability Cap Negotiation",
    category: "Legal",
    successRate: 72,
    timesUsed: 18,
    summary: "Approved alternatives for liability cap modifications",
  },
  {
    id: "3",
    title: "Data Residency Requirements",
    category: "Compliance",
    successRate: 91,
    timesUsed: 12,
    summary: "Response for EU data residency and GDPR compliance requests",
  },
];

const categories = ["All", "Pricing", "Legal", "Compliance", "SLA", "Security"];

export default function LawResponseLibrary() {
  const [selectedResponse, setSelectedResponse] = useState(responses[0]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Response Library</h1>
          <p className="text-muted-foreground mt-2">
            Pre-approved responses for common negotiation requests
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Response
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search responses..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={cat === "All" ? "default" : "outline"}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Response List */}
        <div className="space-y-3">
          {responses.map((response) => (
            <Card
              key={response.id}
              className={`cursor-pointer transition-all ${
                selectedResponse.id === response.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              }`}
              onClick={() => setSelectedResponse(response)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/20">
                    {response.successRate}% success
                  </Badge>
                </div>
                <h3 className="font-medium">{response.title}</h3>
                <Badge variant="outline" className="bg-muted text-xs">
                  {response.category}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Response Detail */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">{selectedResponse.title}</h2>
                  <Button variant="outline">Edit Response</Button>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-muted">
                    {selectedResponse.category}
                  </Badge>
                  <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/20">
                    {selectedResponse.successRate}% Success Rate
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Summary</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedResponse.summary}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Response Template</h3>
                <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed text-muted-foreground italic">
                  Response content will be developed here...
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Usage Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold">
                      {selectedResponse.timesUsed}
                    </div>
                    <div className="text-sm text-muted-foreground">Times Used</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold">
                      {selectedResponse.successRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
