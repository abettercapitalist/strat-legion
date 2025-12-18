import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

interface WaitingItem {
  id: string;
  name: string;
  dueText: string;
  isOverdue?: boolean;
}

interface WaitingOnOthersItem {
  role: string;
  count: number;
}

interface AtRiskItem {
  id: string;
  name: string;
  reason: string;
}

interface FlowVisibilityWidgetsProps {
  modulePrefix: string;
  waitingOnMe: WaitingItem[];
  waitingOnOthers: WaitingOnOthersItem[];
  atRiskItems: AtRiskItem[];
}

export function FlowVisibilityWidgets({
  modulePrefix,
  waitingOnMe,
  waitingOnOthers,
  atRiskItems,
}: FlowVisibilityWidgetsProps) {
  const { labels } = useTheme();
  const totalWaitingOnOthers = waitingOnOthers.reduce((acc, item) => acc + item.count, 0);
  const mattersPath = modulePrefix === "sales" ? "deals" : "matters";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Waiting on Me */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-status-warning/10">
              <Clock className="h-4 w-4 text-status-warning" />
            </div>
            Waiting on Me
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {waitingOnMe.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No items waiting on you</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {waitingOnMe.length} {waitingOnMe.length === 1 ? 'item needs' : 'items need'} your attention
              </p>
              <ul className="space-y-2">
                {waitingOnMe.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    <span>
                      {item.name}{" "}
                      <span className={item.isOverdue ? "text-status-error font-medium" : "text-muted-foreground"}>
                        ({item.dueText})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link to={`/${modulePrefix}/${mattersPath}?filter=waiting-on-me`}>
                <Button variant="ghost" size="sm" className="w-full justify-between mt-2">
                  View All ({waitingOnMe.length})
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Waiting on Others */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            Waiting on Others
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {waitingOnOthers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No items waiting on others</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {totalWaitingOnOthers} {totalWaitingOnOthers === 1 ? 'item' : 'items'} waiting on teammates
              </p>
              <ul className="space-y-2">
                {waitingOnOthers.slice(0, 3).map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    <span>
                      {item.count} pending {item.role}
                    </span>
                  </li>
                ))}
              </ul>
              <Link to={`/${modulePrefix}/${mattersPath}?filter=waiting-on-others`}>
                <Button variant="ghost" size="sm" className="w-full justify-between mt-2">
                  View All ({totalWaitingOnOthers})
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* At Risk of Stalling */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-status-error/10">
              <AlertTriangle className="h-4 w-4 text-status-error" />
            </div>
            At Risk of Stalling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {atRiskItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No items at risk</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {atRiskItems.length} {atRiskItems.length === 1 ? 'item' : 'items'} may need attention
              </p>
              <ul className="space-y-2">
                {atRiskItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    <span>
                      {item.name}{" "}
                      <span className="text-status-error">({item.reason})</span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link to={`/${modulePrefix}/${mattersPath}?filter=at-risk`}>
                <Button variant="ghost" size="sm" className="w-full justify-between mt-2">
                  View All ({atRiskItems.length})
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
