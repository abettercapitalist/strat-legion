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
  { name: "Enterprise SaaS Deal", avgDays: 12.4 },
  { name: "Mid-Market Deal", avgDays: 6.8 },
  { name: "Vendor Agreement", avgDays: 9.2 },
];

const mockClosureByRoute = [
  { name: "Pre-Deal Approval", avgDays: 1.2 },
  { name: "Proposal Approval", avgDays: 3.5 },
  { name: "Closing Approval", avgDays: 2.1 },
];

const mockApprovalDelays = [
  { role: "Finance", percentage: 35 },
  { role: "Legal", percentage: 28 },
  { role: "VP approval", percentage: 18 },
];

const mockInsights = [
  {
    type: "insight" as const,
    title: "Payment terms extended to Net 90 in 5 matters",
    description: "All enterprise customers, all approved within 24hrs",
    suggestion: "Consider making Net 90 standard for enterprise?",
  },
  {
    type: "insight" as const,
    title: "Healthcare matters close 40% faster than average",
    description: "Sarah Johnson approves these 2x faster than team",
    suggestion: "She's becoming healthcare specialist",
  },
  {
    type: "warning" as const,
    title: "Repeated Touches: 3 matters viewed 5+ times",
    description: "Same users checking same matters multiple times",
    suggestion: "May indicate uncertainty or missing information",
  },
];

// Mock data for My Performance
const mockPersonalMetrics = [
  { label: "Approvals", value: "23", change: "↑ 15% from last period", trend: "up" as const },
  { label: "Avg response time", value: "6.2h", change: "↓ 31% faster", trend: "up" as const },
  { label: "Fastest approval", value: "47min", change: "Globex deal" },
];

const mockTeamImpact = [
  { icon: "📚", text: "8 teammates referenced your past decisions" },
  { icon: "⏱️", text: "Your tagged approvals saved 14 hours of research time" },
  { icon: "🤖", text: "2 new auto-approval rules created from your patterns" },
];

// Mock data for Recognition
const mockCandidates = [
  {
    id: "1",
    name: "Sarah Johnson",
    type: "top_performer" as const,
    reason: "Fastest approval time, helped 8 teammates",
    details: [
      "Average approval time: 4.2 hours (team avg: 9.8)",
      "Quality score: 99% (no issues post-approval)",
      "Helped 8 teammates with complex legal questions",
    ],
    isRecognized: false,
  },
  {
    id: "2",
    name: "John Smith",
    type: "breakthrough" as const,
    reason: "First auto-approval rule created",
    details: [
      "Created auto-approval rule for standard NDAs",
      "Rule has processed 12 approvals automatically",
      "Saved estimated 8 hours of manual review time",
    ],
    isRecognized: false,
  },
];

export default function MatterReview() {
  const [activeTab, setActiveTab] = useState("team-patterns");
  const [timePeriod, setTimePeriod] = useState("30");
  const { role } = useAuth();
  const { toast } = useToast();

  // Admin roles that can see the Recognition tab
  const isManager = role === "general_counsel" || role === "legal_ops" || role === "sales_manager";

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
          <h1 className="text-2xl font-semibold">Performance Review</h1>
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
            moduleLabel="Matter"
            closureByType={mockClosureByType}
            closureByRoute={mockClosureByRoute}
            avgApprovalTime={18.5}
            firstTimeApprovalRate={78}
            approvalDelays={mockApprovalDelays}
            insights={mockInsights}
          />
        </TabsContent>

        <TabsContent value="my-performance" className="mt-6">
          <MyPerformanceTab
            timePeriod={getTimePeriodLabel(timePeriod)}
            personalMetrics={mockPersonalMetrics}
            speedComparison={{
              yourSpeed: 6.2,
              teamAverage: 9.8,
              percentile: 15,
            }}
            qualityComparison={{
              yourQuality: 98,
              teamAverage: 94,
              percentile: 20,
            }}
            teamImpact={mockTeamImpact}
            topInsight={{
              text: "Established customers with payment history >2 years are low-risk for Net 90 terms",
              usageCount: 6,
            }}
            teamStats={{
              avgApprovalTime: 9.8,
              previousAvgTime: 11.2,
              autoApprovalRate: 23,
              previousAutoRate: 18,
              teamHelps: 47,
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
                recognizedLast3Months: 7,
                dismissedLast3Months: 4,
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
