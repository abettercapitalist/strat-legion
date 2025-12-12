import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, ChevronDown, GripVertical, Plus } from 'lucide-react';
import { useClauses, Clause } from '@/hooks/useClauses';
import { cn } from '@/lib/utils';

interface ClauseLibrarySidebarProps {
  onInsertClause?: (clause: Clause) => void;
  className?: string;
}

export function ClauseLibrarySidebar({ onInsertClause, className }: ClauseLibrarySidebarProps) {
  const { clauses, loading, error, refresh } = useClauses();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(clauses.map(c => c.category));
    return Array.from(cats).sort();
  }, [clauses]);

  // Filter clauses
  const filteredClauses = useMemo(() => {
    return clauses.filter(clause => {
      const matchesSearch = !search || 
        clause.title.toLowerCase().includes(search.toLowerCase()) ||
        clause.text.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || clause.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [clauses, search, categoryFilter]);

  // Group by category
  const groupedClauses = useMemo(() => {
    const groups: Record<string, Clause[]> = {};
    for (const clause of filteredClauses) {
      if (!groups[clause.category]) {
        groups[clause.category] = [];
      }
      groups[clause.category].push(clause);
    }
    return groups;
  }, [filteredClauses]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clause Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clause Library</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base">Clause Library</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clauses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clauses List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-3">
            {Object.entries(groupedClauses).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No clauses found
              </p>
            ) : (
              Object.entries(groupedClauses).map(([category, categoryClauses]) => (
                <Collapsible
                  key={category}
                  open={expandedCategories.has(category)}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full p-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">
                      <span>{category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {categoryClauses.length}
                        </Badge>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          expandedCategories.has(category) && "rotate-180"
                        )} />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pt-1">
                    {categoryClauses.map(clause => (
                      <div
                        key={clause.id}
                        className="group flex items-start gap-2 p-2 rounded-md border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify(clause));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {clause.title}
                            </span>
                            {clause.risk_level && (
                              <Badge 
                                variant={getRiskBadgeVariant(clause.risk_level)}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {clause.risk_level}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {clause.text}
                          </p>
                        </div>
                        {onInsertClause && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onInsertClause(clause)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Drag clauses to insert into template
        </p>
      </CardContent>
    </Card>
  );
}
