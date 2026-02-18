import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Copy, BookOpen, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ResponseEntry {
  id: string;
  title: string;
  response_text: string;
  category: string | null;
  success_rate: number | null;
  usage_count: number | null;
  tags: string[] | null;
}

function useResponseLibrary() {
  return useQuery({
    queryKey: ["response-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("response_library")
        .select("id, title, response_text, category, success_rate, usage_count, tags")
        .order("usage_count", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data ?? []) as ResponseEntry[];
    },
  });
}

function getSuccessColor(rate: number) {
  if (rate >= 70) return "bg-status-success/10 text-status-success border-status-success/20";
  if (rate >= 50) return "bg-status-warning/10 text-status-warning border-status-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

export default function ResponseLibrary() {
  const { data: responses = [], isLoading } = useResponseLibrary();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Derive categories from data
  const categories = useMemo(() => {
    const cats = new Set(responses.map((r) => r.category).filter(Boolean) as string[]);
    return ["All", ...Array.from(cats).sort()];
  }, [responses]);

  // Filter responses
  const filtered = useMemo(() => {
    return responses.filter((r) => {
      if (activeCategory !== "All" && r.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.response_text.toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [responses, activeCategory, search]);

  const selectedResponse = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Response Library</h1>
          <p className="text-muted-foreground mt-2">
            Proven responses to common customer requests
          </p>
        </div>
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No responses yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add responses to build your team's knowledge base
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Response Library</h1>
        <p className="text-muted-foreground mt-2">
          Proven responses to common customer requests
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search responses..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={cat === activeCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Response List */}
        <div className="space-y-3">
          {filtered.map((response) => (
            <Card
              key={response.id}
              className={`cursor-pointer transition-all ${
                selectedResponse?.id === response.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              }`}
              onClick={() => setSelectedId(response.id)}
            >
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium text-sm leading-snug">
                  {response.title}
                </h3>
                {response.category && (
                  <p className="text-xs text-muted-foreground">
                    {response.category}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  {response.success_rate != null && (
                    <Badge
                      variant="outline"
                      className={getSuccessColor(response.success_rate)}
                    >
                      {response.success_rate}% success
                    </Badge>
                  )}
                  {response.usage_count != null && response.usage_count > 0 && (
                    <Badge variant="outline" className="bg-muted text-xs">
                      {response.usage_count} uses
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No responses match your search
            </p>
          )}
        </div>

        {/* Right: Response Detail */}
        {selectedResponse && (
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    {selectedResponse.title}
                  </h2>
                  <div className="flex gap-2">
                    {selectedResponse.success_rate != null && (
                      <Badge
                        variant="outline"
                        className={getSuccessColor(selectedResponse.success_rate)}
                      >
                        {selectedResponse.success_rate}% Success Rate
                      </Badge>
                    )}
                    {selectedResponse.usage_count != null && (
                      <Badge variant="outline" className="bg-muted">
                        Used {selectedResponse.usage_count} times
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Recommended Response</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(selectedResponse.response_text)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Response
                    </Button>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedResponse.response_text}
                  </div>
                </div>

                {selectedResponse.tags && selectedResponse.tags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedResponse.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-muted text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="font-medium">Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-semibold">
                        {selectedResponse.usage_count ?? 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Times Used</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-semibold">
                        {selectedResponse.success_rate ?? "—"}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-semibold">
                        {selectedResponse.category ?? "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">Category</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigator.clipboard.writeText(selectedResponse.response_text)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy & Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
