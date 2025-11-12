import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const topNegotiatedClauses = [
  { clause: "Payment Terms", changes: 42, avgTime: 3.2 },
  { clause: "Liability Cap", changes: 38, avgTime: 4.1 },
  { clause: "Termination Rights", changes: 35, avgTime: 2.8 },
  { clause: "IP Ownership", changes: 28, avgTime: 5.3 },
  { clause: "SLA Terms", changes: 24, avgTime: 2.5 },
];

const deviationPatterns = [
  {
    clause: "4.2 - Payment Terms",
    change: "Net 30 → Net 90",
    occurrences: 42,
    action: "Consider adding Net 90 alternative",
  },
  {
    clause: "8.1 - Liability Cap",
    change: "1x fees → 2x fees",
    occurrences: 28,
    action: "Create pre-approved 2x alternative",
  },
  {
    clause: "10.1 - Termination",
    change: "30 days → 60 days notice",
    occurrences: 22,
    action: "Update standard to 60 days",
  },
];

const alternativeUsage = [
  {
    clause: "4.2 - Payment Terms",
    alternative: "Alt B: Net 90",
    timesUsed: 45,
    successRate: 78,
    insight: "Most popular alternative - consider making standard",
  },
  {
    clause: "8.1 - Liability",
    alternative: "Alt A: 2x Annual Fees",
    timesUsed: 32,
    successRate: 85,
    insight: "High success rate for enterprise deals",
  },
  {
    clause: "5.1 - Confidentiality",
    alternative: "Alt C: Mutual NDA",
    timesUsed: 8,
    successRate: 45,
    insight: "Low usage - review necessity",
  },
];

const chartData = topNegotiatedClauses.map(item => ({
  name: item.clause,
  changes: item.changes,
}));

export default function LearningDashboard() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-semibold">Learning Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Insights from contract negotiations and clause usage (Q4 2025)
        </p>
      </div>

      {/* Top Negotiated Clauses */}
      <Card>
        <CardHeader>
          <CardTitle>Top Negotiated Clauses</CardTitle>
          <p className="text-sm text-muted-foreground">
            Clauses most frequently modified during negotiations
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="changes" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Clause</th>
                  <th className="px-6 py-4 font-medium">Times Changed</th>
                  <th className="px-6 py-4 font-medium">Avg Negotiation Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topNegotiatedClauses.map((item, index) => (
                  <tr key={index} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.clause}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.changes}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {item.avgTime} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deviation Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Common Deviation Patterns</CardTitle>
          <p className="text-sm text-muted-foreground">
            Frequent modifications that may warrant template updates
          </p>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Clause</th>
                  <th className="px-6 py-4 font-medium">Common Change</th>
                  <th className="px-6 py-4 font-medium">Occurrences</th>
                  <th className="px-6 py-4 font-medium">Suggested Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deviationPatterns.map((item, index) => (
                  <tr key={index} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-sm">
                      {item.clause}
                    </td>
                    <td className="px-6 py-4 text-sm">{item.change}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {item.occurrences}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {item.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Alternative Usage Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Which clause alternatives are most/least effective
          </p>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Clause</th>
                  <th className="px-6 py-4 font-medium">Alternative</th>
                  <th className="px-6 py-4 font-medium">Times Used</th>
                  <th className="px-6 py-4 font-medium">Success Rate</th>
                  <th className="px-6 py-4 font-medium">Insight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alternativeUsage.map((item, index) => (
                  <tr key={index} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-sm">
                      {item.clause}
                    </td>
                    <td className="px-6 py-4 text-sm">{item.alternative}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-muted">
                        {item.timesUsed}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          item.successRate >= 70
                            ? "bg-status-success/10 text-status-success border-status-success/20"
                            : item.successRate >= 50
                            ? "bg-status-warning/10 text-status-warning border-status-warning/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }
                      >
                        {item.successRate}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {item.insight}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}