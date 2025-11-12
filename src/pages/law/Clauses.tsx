import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const clauses = [
  {
    id: "1",
    number: "4.2",
    title: "Payment Terms",
    category: "Pricing",
    riskLevel: "Low",
    text: "Customer shall pay all fees in accordance with the payment schedule...",
    alternativesCount: 2,
    templatesCount: 5,
  },
  {
    id: "2",
    number: "5.1",
    title: "Confidentiality",
    category: "Legal",
    riskLevel: "Medium",
    text: "Each party shall protect the confidential information of the other party...",
    alternativesCount: 1,
    templatesCount: 8,
  },
  {
    id: "3",
    number: "8.1",
    title: "Limitation of Liability",
    category: "Business",
    riskLevel: "High",
    text: "In no event shall either party be liable for any indirect, incidental...",
    alternativesCount: 3,
    templatesCount: 7,
  },
  {
    id: "4",
    number: "9.1",
    title: "Intellectual Property",
    category: "Business",
    riskLevel: "High",
    text: "All intellectual property rights in the software shall remain with Company...",
    alternativesCount: 2,
    templatesCount: 6,
  },
  {
    id: "5",
    number: "10.1",
    title: "Termination Rights",
    category: "Business",
    riskLevel: "Medium",
    text: "Either party may terminate this agreement with 30 days written notice...",
    alternativesCount: 2,
    templatesCount: 9,
  },
];

const categories = ["All", "Pricing", "Legal", "Business", "SLA", "Warranty"];

function getRiskColor(risk: string) {
  switch (risk) {
    case "High":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "Medium":
      return "bg-status-warning/10 text-status-warning border-status-warning/20";
    case "Low":
      return "bg-status-success/10 text-status-success border-status-success/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function Clauses() {
  const [selectedClause, setSelectedClause] = useState(clauses[0]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Clause Library</h1>
          <p className="text-muted-foreground mt-2">
            Browse and manage reusable contract clauses
          </p>
        </div>
        <Link to="/law/clauses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Clause
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clauses..." className="pl-10" />
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
        {/* Left: Clause List */}
        <div className="space-y-3">
          {clauses.map((clause) => (
            <Card
              key={clause.id}
              className={`cursor-pointer transition-all ${
                selectedClause.id === clause.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              }`}
              onClick={() => setSelectedClause(clause)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-mono text-muted-foreground">
                    {clause.number}
                  </span>
                  <Badge variant="outline" className={getRiskColor(clause.riskLevel)}>
                    {clause.riskLevel}
                  </Badge>
                </div>
                <h3 className="font-medium">{clause.title}</h3>
                <Badge variant="outline" className="bg-muted text-xs">
                  {clause.category}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Clause Detail */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono text-muted-foreground">
                      {selectedClause.number}
                    </span>
                    <h2 className="text-2xl font-semibold">{selectedClause.title}</h2>
                  </div>
                  <Link to={`/law/clauses/${selectedClause.id}/edit`}>
                    <Button variant="outline">Edit Clause</Button>
                  </Link>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-muted">
                    {selectedClause.category}
                  </Badge>
                  <Badge variant="outline" className={getRiskColor(selectedClause.riskLevel)}>
                    {selectedClause.riskLevel} Risk
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Standard Text</h3>
                <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed">
                  {selectedClause.text}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Business Context</h3>
                <p className="text-sm text-muted-foreground">
                  This clause establishes the foundation for payment obligations and
                  timing. It protects cash flow while remaining flexible for
                  enterprise customers.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Alternatives</h3>
                  <Badge variant="outline" className="bg-muted">
                    {selectedClause.alternativesCount} alternatives
                  </Badge>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  Alternative versions available for different use cases
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Usage Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold">
                      {selectedClause.templatesCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Templates</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold">32</div>
                    <div className="text-sm text-muted-foreground">
                      Times negotiated (Q4)
                    </div>
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
