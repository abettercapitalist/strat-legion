import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamPatternsTab } from "@/components/review/TeamPatternsTab";
import { MyPerformanceTab } from "@/components/review/MyPerformanceTab";
import { RecognitionTab } from "@/components/review/RecognitionTab";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Mock data for Team Patterns
const mockClosureByType = [
  { name: "Enterprise SaaS Deal", avgDays: 14.2 },
  { name: "Mid-Market Deal", avgDays: 8.4 },
  { name: "SMB Deal", avgDays: 4.6 },
  { name: "Renewal", avgDays: 3.2 },
];

const mockClosureByRoute = [
  { name: "Discount Approval", avgDays: 0.8 },
  { name: "Legal Review", avgDays: 2.4 },
  { name: "Finance Approval", avgDays: 1.6 },
];

const mockApprovalDelays = [
  { role: "Finance", percentage: 42 },
  { role: "Legal", percentage: 31 },
  { role: "Sales Manager", percentage: 15 },
];

const mockInsights = [
  {
    type: "insight" as const,
    title: "Q4 deals closing 25% faster than Q3",
    description: "New pricing tiers reducing back-and-forth on custom quotes",
    suggestion: "Consider expanding tiered pricing to all segments?",
  },
  {
    type: "insight" as const,
    title: "Healthcare vertical has 85% close rate",
    description: "Mike Chen has closed 12 of 14 healthcare opportunities",
    suggestion: "Route healthcare leads to Mike for higher conversion",
  },
  {
    type: "warning" as const,
    title: "5 deals stalled at Legal review stage",
    description: "Average wait time: 4.3 days (vs 2.4 day target)",
    suggestion: "May need additional legal resources or clearer SLAs",
  },
];

// Mock data for My Performance
const mockPersonalMetrics = [
  { label: "Deals Closed", value: "8", change: "↑ 23% from last period", trend: "up" as const },
  { label: "Avg deal cycle", value: "11.2 days", change: "↓ 18% faster", trend: "up" as const },
  { label: "Win rate", value: "68%", change: "↑ from 61%", trend: "up" as const },
];

const mockTeamImpact = [
  { icon: "🎯", text: "Your deal templates used by 5 teammates" },
  { icon: "💡", text: "Pricing strategy shared saved $45K in discounts" },
  { icon: "🤝", text: "Helped 3 teammates close enterprise deals" },
];

// Mock data for Recognition
const mockCandidates = [
  {
    id: "1",
    name: "Mike Chen",
    type: "top_performer" as const,
    reason: "Highest win rate, healthcare specialist",
    details: [
      "Win rate: 85% (team avg: 62%)",
      "Closed $420K in Q4 alone",
      "Mentored 2 new team members",
    ],
    isRecognized: false,
  },
  {
    id: "2",
    name: "Lisa Park",
    type: "most_improved" as const,
    reason: "Fastest improvement in deal cycle time",
    details: [
      "Reduced avg deal cycle from 18 days to 10 days",
      "Adopted new qualification framework",
      "First to use new pricing calculator",
    ],
    isRecognized: false,
  },
];

export default function DealReview() {
  const [activeTab, setActiveTab] = useState("team-patterns");
  const [timePeriod, setTimePeriod] = useState("30");
  const { role } = useAuth();
  const { toast } = useToast();

  // Admin roles that can see the Recognition tab
  const isManager = role === "sales_manager" || role === "general_counsel" || role === "legal_ops";

  const handleReviewDetails = (candidateId: string) => {
    toast({
      title: "Review Details",
      description: "Opening detailed performance report...",
    });
  };

  const handleRecognize = (candidateId: string) => {
    toast({
      title: "Recognition Recorded",
      description: "Team member has been recognized. Consider delivering recognition personally!",
    });
  };

  const handleDismiss = (candidateId: string) => {
    toast({
      title: "Dismissed",
      description: "Recognition opportunity dismissed for this period.",
    });
  };

  const getTimePeriodLabel = (days: string) => {
    switch (days) {
      case "7": return "Last 7 Days";
      case "30": return "Last 30 Days";
      case "90": return "Last 90 Days";
      default: return "Last 30 Days";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deal Review</h1>
          <p className="text-muted-foreground">
            Analyze patterns, track performance, and identify improvements
          </p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="team-patterns">Team Patterns</TabsTrigger>
          <TabsTrigger value="my-performance">My Performance</TabsTrigger>
          {isManager && <TabsTrigger value="recognition">Recognition</TabsTrigger>}
        </TabsList>

        <TabsContent value="team-patterns" className="mt-6">
          <TeamPatternsTab
            timePeriod={getTimePeriodLabel(timePeriod)}
            moduleLabel="Deal"
            closureByType={mockClosureByType}
            closureByRoute={mockClosureByRoute}
            avgApprovalTime={14.2}
            firstTimeApprovalRate={72}
            approvalDelays={mockApprovalDelays}
            insights={mockInsights}
          />
        </TabsContent>

        <TabsContent value="my-performance" className="mt-6">
          <MyPerformanceTab
            timePeriod={getTimePeriodLabel(timePeriod)}
            personalMetrics={mockPersonalMetrics}
            speedComparison={{
              yourSpeed: 11.2,
              teamAverage: 14.8,
              percentile: 22,
            }}
            qualityComparison={{
              yourQuality: 68,
              teamAverage: 62,
              percentile: 18,
            }}
            teamImpact={mockTeamImpact}
            topInsight={{
              text: "Multi-year deals with annual payment upfront have 95% renewal rate",
              usageCount: 8,
            }}
            teamStats={{
              avgApprovalTime: 14.2,
              previousAvgTime: 16.8,
              autoApprovalRate: 31,
              previousAutoRate: 24,
              teamHelps: 52,
            }}
          />
        </TabsContent>

        {isManager && (
          <TabsContent value="recognition" className="mt-6">
            <RecognitionTab
              currentMonth="December 2025"
              candidates={mockCandidates}
              recognitionStats={{
                targetPerMonth: "2-3 per month",
                recognizedLast3Months: 8,
                dismissedLast3Months: 3,
              }}
              onReviewDetails={handleReviewDetails}
              onRecognize={handleRecognize}
              onDismiss={handleDismiss}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
