import { useParams, useNavigate, Link } from "react-router-dom";
import { Briefcase, Scale, Coins, Wrench, ArrowRight, FileText, Route } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Module configuration
const moduleConfig: Record<string, {
  displayName: string;
  itemName: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}> = {
  sales: {
    displayName: "Sales",
    itemName: "Deal",
    icon: Briefcase,
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  law: {
    displayName: "Law",
    itemName: "Matter",
    icon: Scale,
    colorClass: "text-purple-600",
    bgClass: "bg-purple-100",
  },
  finance: {
    displayName: "Finance",
    itemName: "Project",
    icon: Coins,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-100",
  },
  "pro-services": {
    displayName: "Pro Services",
    itemName: "Engagement",
    icon: Wrench,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-100",
  },
};

interface WorkstreamType {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  required_documents: string[] | null;
  approval_template_id: string | null;
  default_workflow: unknown;
}

export default function SelectPlay() {
  const { module } = useParams<{ module: string }>();
  const navigate = useNavigate();
  
  const config = module ? moduleConfig[module] : null;
  const ModuleIcon = config?.icon || Briefcase;

  // Fetch active plays for the current module
  const { data: plays, isLoading, error } = useQuery({
    queryKey: ["plays", module],
    queryFn: async () => {
      // Map module URL to team_category in database
      const teamCategoryMap: Record<string, string> = {
        sales: "Sales",
        law: "Law",
        finance: "Finance",
        "pro-services": "Pro Services",
      };
      
      const teamCategory = module ? teamCategoryMap[module] : null;
      
      const { data, error } = await supabase
        .from("workstream_types")
        .select("*")
        .eq("status", "Active")
        .eq("team_category", teamCategory || "")
        .order("display_name", { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data as WorkstreamType[];
    },
    enabled: !!module,
  });

  // Count approval routes from workflow
  const countApprovalRoutes = (workflow: unknown): number => {
    if (!workflow || typeof workflow !== "object") return 0;
    const w = workflow as { steps?: Array<{ step_type?: string }> };
    if (!Array.isArray(w.steps)) return 0;
    return w.steps.filter((s) => s.step_type === "approval_gate").length;
  };

  const handleStartPlay = (playId: string) => {
    navigate(`/${module}/new/${playId}`);
  };

  if (!config) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Unknown module</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/${module}`}>{config.displayName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New {config.itemName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          Start New {config.itemName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose the type of {config.itemName.toLowerCase()} to create
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-16">
          <p className="text-destructive">Failed to load plays</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && plays?.length === 0 && (
        <Card className="text-center py-16">
          <CardContent className="space-y-4">
            <div className={`inline-flex p-4 rounded-full ${config.bgClass}`}>
              <ModuleIcon className={`h-8 w-8 ${config.colorClass}`} />
            </div>
            <h3 className="text-lg font-medium text-foreground">No plays available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Contact your admin to create plays for this module
            </p>
            <Button variant="outline" asChild>
              <Link to="/admin/workstream-types">Go to Play Library</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plays grid */}
      {!isLoading && !error && plays && plays.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plays.map((play) => {
            const approvalCount = countApprovalRoutes(play.default_workflow);
            const docCount = play.required_documents?.length || 0;
            
            return (
              <Card
                key={play.id}
                className="group hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer"
                onClick={() => handleStartPlay(play.id)}
              >
                <CardHeader className="pb-3">
                  <div className={`inline-flex p-2.5 rounded-md ${config.bgClass} w-fit`}>
                    <ModuleIcon className={`h-5 w-5 ${config.colorClass}`} />
                  </div>
                  <CardTitle className="text-lg mt-3">
                    {play.display_name || play.name}
                  </CardTitle>
                  {play.description && (
                    <CardDescription className="line-clamp-2">
                      {play.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {approvalCount > 0 && (
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4" />
                        <span>{approvalCount} approval route{approvalCount !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                    {docCount > 0 && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{docCount} required document{docCount !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Start {config.itemName}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
