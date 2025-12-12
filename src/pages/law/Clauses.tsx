import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useClauses, type Clause, type ClauseAlternative } from "@/hooks/useClauses";

const categories = ["All", "Pricing", "Legal", "Business", "SLA", "Warranty"];

function getRiskColor(risk: string) {
  switch (risk?.toLowerCase()) {
    case "high":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "medium":
      return "bg-status-warning/10 text-status-warning border-status-warning/20";
    case "low":
      return "bg-status-success/10 text-status-success border-status-success/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function capitalizeFirst(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : str;
}

export default function Clauses() {
  const { clauses, loading, error, getClauseAlternatives } = useClauses();
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [alternatives, setAlternatives] = useState<ClauseAlternative[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Set initial selected clause when clauses load
  useEffect(() => {
    if (clauses.length > 0 && !selectedClause) {
      setSelectedClause(clauses[0]);
    }
  }, [clauses, selectedClause]);

  // Load alternatives when clause changes
  useEffect(() => {
    if (selectedClause) {
      getClauseAlternatives(selectedClause.id).then(setAlternatives);
    }
  }, [selectedClause, getClauseAlternatives]);

  // Filter clauses based on search and category
  const filteredClauses = useMemo(() => {
    return clauses.filter((clause) => {
      const matchesSearch =
        searchQuery === "" ||
        clause.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clause.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clause.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "All" ||
        clause.category.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [clauses, searchQuery, activeCategory]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load clauses</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

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
          <Input
            placeholder="Search clauses..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Clause List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </CardContent>
              </Card>
            ))
          ) : filteredClauses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clauses found
            </div>
          ) : (
            filteredClauses.map((clause) => (
              <Card
                key={clause.id}
                className={`cursor-pointer transition-all ${
                  selectedClause?.id === clause.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/30"
                }`}
                onClick={() => setSelectedClause(clause)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{clause.title}</h3>
                    <Badge variant="outline" className={getRiskColor(clause.risk_level)}>
                      {capitalizeFirst(clause.risk_level)}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="bg-muted text-xs">
                    {clause.category}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Right: Clause Detail */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <Card>
              <CardContent className="p-6 space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ) : selectedClause ? (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">{selectedClause.title}</h2>
                    <Link to={`/law/clauses/${selectedClause.id}/edit`}>
                      <Button variant="outline">Edit Clause</Button>
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-muted">
                      {selectedClause.category}
                    </Badge>
                    <Badge variant="outline" className={getRiskColor(selectedClause.risk_level)}>
                      {capitalizeFirst(selectedClause.risk_level)} Risk
                    </Badge>
                    {selectedClause.is_standard && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Standard
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Standard Text</h3>
                  <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedClause.text}
                  </div>
                </div>

                {selectedClause.business_context && (
                  <div className="space-y-3">
                    <h3 className="font-medium">Business Context</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedClause.business_context}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Alternatives</h3>
                    <Badge variant="outline" className="bg-muted">
                      {alternatives.length} alternative{alternatives.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {alternatives.length > 0 ? (
                    <div className="space-y-3">
                      {alternatives.map((alt, idx) => (
                        <div key={alt.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Alternative {idx + 1}</span>
                            {alt.use_case && (
                              <Badge variant="outline" className="text-xs">
                                {alt.use_case}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{alt.alternative_text}</p>
                          {alt.business_impact && (
                            <p className="text-xs text-muted-foreground">
                              Impact: {alt.business_impact}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                      No alternative versions defined
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">Created</div>
                      <div className="font-medium">
                        {new Date(selectedClause.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">Last Updated</div>
                      <div className="font-medium">
                        {new Date(selectedClause.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Select a clause to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
