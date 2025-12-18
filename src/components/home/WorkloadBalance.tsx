import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

interface WorkloadBalanceProps {
  userLoad: number; // 0-100
  teamAverage: number; // 0-100
}

function getWorkloadMessage(userLoad: number, teamAverage: number): string {
  if (userLoad < teamAverage - 20) {
    return "You have capacity to assist.";
  } else if (userLoad > teamAverage + 20) {
    return "Your workload is above team average.";
  } else {
    return "Your workload is balanced with the team.";
  }
}

export function WorkloadBalance({ userLoad, teamAverage }: WorkloadBalanceProps) {
  const message = getWorkloadMessage(userLoad, teamAverage);
  const maxLoad = Math.max(userLoad, teamAverage, 100);
  
  // Normalize to percentage of display width
  const userWidth = (userLoad / maxLoad) * 100;
  const teamWidth = (teamAverage / maxLoad) * 100;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          Workload Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {/* User Load Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">My Load</span>
              <span className="text-primary font-medium">↑ You</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${userWidth}%` }}
              />
            </div>
          </div>

          {/* Team Average Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Team Load</span>
              <span className="text-muted-foreground font-medium">↑ Team Average</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-muted-foreground/40 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${teamWidth}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground pt-1">{message}</p>
      </CardContent>
    </Card>
  );
}
