import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Hand, 
  Users, 
  Hourglass, 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  MessageSquare, 
  ClipboardCheck,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Need {
  id: string;
  workstream_id: string;
  need_type: string;
  description: string;
  satisfier_role: string | null;
  status: string;
  due_at: string | null;
  source_reason: string | null;
  created_at: string;
  workstream?: {
    name: string;
  };
}

interface NeedsDashboardProps {
  modulePrefix: string;
  userRole?: string;
  teamRoles?: string[];
}

const NEED_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  approval: CheckCircle,
  document: FileText,
  information: MessageSquare,
  review: ClipboardCheck,
  action: Zap,
};

const NEED_TYPE_COLORS: Record<string, string> = {
  approval: "bg-primary/10 text-primary",
  document: "bg-blue-500/10 text-blue-600",
  information: "bg-amber-500/10 text-amber-600",
  review: "bg-purple-500/10 text-purple-600",
  action: "bg-green-500/10 text-green-600",
};

export function NeedsDashboard({ 
  modulePrefix, 
  userRole = "legal_ops",
  teamRoles = ["legal_ops", "contract_counsel", "general_counsel"]
}: NeedsDashboardProps) {
  const [myNeeds, setMyNeeds] = useState<Need[]>([]);
  const [teamWaitingOn, setTeamWaitingOn] = useState<{ role: string; count: number; needs: Need[] }[]>([]);
  const [waitingFor, setWaitingFor] = useState<Need[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNeeds() {
      setIsLoading(true);
      try {
        // Fetch needs I need to satisfy (assigned to my role)
        const { data: myNeedsData } = await supabase
          .from("needs")
          .select("*")
          .eq("satisfier_role", userRole)
          .in("status", ["open", "expressed", "committed"])
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(10);

        // Fetch workstream names for my needs
        const myNeedsWithWorkstreams = await enrichNeedsWithWorkstreams(myNeedsData || []);
        setMyNeeds(myNeedsWithWorkstreams);

        // Fetch needs waiting on team (grouped by role)
        const { data: teamNeedsData } = await supabase
          .from("needs")
          .select("*")
          .in("satisfier_role", teamRoles)
          .in("status", ["open", "expressed"])
          .order("created_at", { ascending: false })
          .limit(50);

        // Group by role
        const roleGroups: Record<string, Need[]> = {};
        const teamNeedsWithWorkstreams = await enrichNeedsWithWorkstreams(teamNeedsData || []);
        for (const need of teamNeedsWithWorkstreams) {
          const role = need.satisfier_role || "unassigned";
          if (!roleGroups[role]) roleGroups[role] = [];
          roleGroups[role].push(need);
        }

        const groupedTeamNeeds = Object.entries(roleGroups).map(([role, needs]) => ({
          role,
          count: needs.length,
          needs: needs.slice(0, 3),
        }));

        setTeamWaitingOn(groupedTeamNeeds);

        // Fetch needs I'm waiting for (needs on my workstreams that aren't satisfied)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // First get workstreams owned by user
          const { data: myWorkstreams } = await supabase
            .from("workstreams")
            .select("id, name")
            .eq("owner_id", user.id);

          if (myWorkstreams && myWorkstreams.length > 0) {
            const workstreamIds = myWorkstreams.map(w => w.id);
            const workstreamMap = new Map(myWorkstreams.map(w => [w.id, w.name]));

            const { data: waitingData } = await supabase
              .from("needs")
              .select("*")
              .in("workstream_id", workstreamIds)
              .neq("status", "satisfied")
              .neq("satisfier_role", userRole)
              .order("due_at", { ascending: true, nullsFirst: false })
              .limit(10);

            const waitingWithWorkstreams = (waitingData || []).map(need => ({
              ...need,
              workstream: { name: workstreamMap.get(need.workstream_id) || "Unknown" }
            })) as Need[];

            setWaitingFor(waitingWithWorkstreams);
          } else {
            setWaitingFor([]);
          }
        }
      } catch (error) {
        console.error("Error fetching needs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function enrichNeedsWithWorkstreams(needs: any[]): Promise<Need[]> {
      if (needs.length === 0) return [];
      
      const workstreamIds = [...new Set(needs.map(n => n.workstream_id))];
      const { data: workstreams } = await supabase
        .from("workstreams")
        .select("id, name")
        .in("id", workstreamIds);

      const workstreamMap = new Map((workstreams || []).map(w => [w.id, w.name]));

      return needs.map(need => ({
        ...need,
        workstream: { name: workstreamMap.get(need.workstream_id) || "Unknown" }
      }));
    }

    fetchNeeds();
  }, [userRole, teamRoles]);

  const formatDueDate = (dueAt: string | null) => {
    if (!dueAt) return null;
    const due = new Date(dueAt);
    const now = new Date();
    const isOverdue = due < now;
    const text = formatDistanceToNow(due, { addSuffix: true });
    return { text, isOverdue };
  };

  const NeedIcon = ({ type }: { type: string }) => {
    const Icon = NEED_TYPE_ICONS[type] || Zap;
    const colorClass = NEED_TYPE_COLORS[type] || "bg-muted text-muted-foreground";
    return (
      <div className={`p-1.5 rounded-md ${colorClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const mattersPath = modulePrefix === "sales" ? "deals" : "matters";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* What I Need to Do */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Hand className="h-4 w-4 text-primary" />
            </div>
            What I Need to Do
            {myNeeds.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {myNeeds.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {myNeeds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No needs waiting on you
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {myNeeds.slice(0, 4).map((need) => {
                  const due = formatDueDate(need.due_at);
                  return (
                    <li key={need.id} className="flex items-start gap-2 text-sm">
                      <NeedIcon type={need.need_type} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{need.description}</p>
                        <p className="text-muted-foreground text-xs truncate">
                          {need.workstream?.name}
                          {due && (
                            <span className={due.isOverdue ? " text-destructive font-medium" : ""}>
                              {" "}• {due.text}
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link to={`/${modulePrefix}/${mattersPath}?filter=my-needs`}>
                <Button variant="ghost" size="sm" className="w-full justify-between mt-2">
                  View All ({myNeeds.length})
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* What My Team is Waiting On */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            Team is Waiting On
            {teamWaitingOn.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {teamWaitingOn.reduce((acc, g) => acc + g.count, 0)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamWaitingOn.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No outstanding team needs
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {teamWaitingOn.slice(0, 4).map((group) => (
                  <li key={group.role} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    <div className="flex-1">
                      <p className="font-medium capitalize">
                        {group.count} from {group.role.replace(/_/g, " ")}
                      </p>
                      {group.needs[0] && (
                        <p className="text-muted-foreground text-xs truncate">
                          e.g. {group.needs[0].description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Link to={`/${modulePrefix}/${mattersPath}?filter=team-needs`}>
                <Button variant="ghost" size="sm" className="w-full justify-between mt-2">
                  View All ({teamWaitingOn.reduce((acc, g) => acc + g.count, 0)})
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* What I'm Waiting For */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/10">
              <Hourglass className="h-4 w-4 text-amber-600" />
            </div>
            What I'm Waiting For
            {waitingFor.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {waitingFor.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {waitingFor.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Nothing blocking your workstreams
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {waitingFor.slice(0, 4).map((need) => {
                  const due = formatDueDate(need.due_at);
                  return (
                    <li key={need.id} className="flex items-start gap-2 text-sm">
                      <NeedIcon type={need.need_type} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{need.description}</p>
                        <p className="text-muted-foreground text-xs truncate">
                          {need.satisfier_role?.replace(/_/g, " ") || "Unassigned"}
                          {due && (
                            <span className={due.isOverdue ? " text-destructive font-medium" : ""}>
                              {" "}• {due.text}
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link to={`/${modulePrefix}/${mattersPath}?filter=waiting-for`}>
                <Button variant="ghost" size="sm" className="w-full justify-between mt-2">
                  View All ({waitingFor.length})
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
