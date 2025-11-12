import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Copy } from "lucide-react";
import { useState } from "react";

const responses = [
  {
    id: "1",
    request: "Customer requests Net 90 payment terms",
    summary: "Offer annual upfront discount alternative",
    successRate: 70,
    timesUsed: 42,
    fullResponse: "We understand the request for extended payment terms. We can offer Net 90 with a 5% increase in annual fees, or we can provide a 10% discount for annual upfront payment. Most customers find the upfront discount more valuable.",
    rationale: "Protects cash flow while providing customer flexibility",
    context: "Use for enterprise customers with established payment processes",
  },
  {
    id: "2",
    request: "Customer wants 20% discount from list price",
    summary: "Volume commitment counter-offer",
    successRate: 65,
    timesUsed: 38,
    fullResponse: "We appreciate your interest in a volume discount. We can offer 15% off list price with a 3-year commitment and minimum of 500 seats. For your initial year at 200 seats, we can offer 10% off with expansion pricing locked in.",
    rationale: "Balances discount with commitment and expansion opportunity",
    context: "Best for growing companies with clear expansion path",
  },
  {
    id: "3",
    request: "Customer asks for monthly billing instead of annual",
    summary: "Quarterly billing compromise",
    successRate: 80,
    timesUsed: 56,
    fullResponse: "We can offer quarterly billing at the same annual rate, providing you flexibility while maintaining predictable cash flow. Many customers find this strikes the right balance. Monthly billing would require a 15% increase in total annual cost.",
    rationale: "Reduces cash flow risk while accommodating customer preference",
    context: "Works well for mid-market customers",
  },
];

const categories = ["All", "Payment Terms", "Pricing", "Volume", "Duration"];

function getSuccessColor(rate: number) {
  if (rate >= 70) return "bg-status-success/10 text-status-success border-status-success/20";
  if (rate >= 50) return "bg-status-warning/10 text-status-warning border-status-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

export default function ResponseLibrary() {
  const [selectedResponse, setSelectedResponse] = useState(responses[0]);

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
          <Input placeholder="Search responses..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={cat === "All" ? "default" : "outline"}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Response List */}
        <div className="space-y-3">
          {responses.map((response) => (
            <Card
              key={response.id}
              className={`cursor-pointer transition-all ${
                selectedResponse.id === response.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              }`}
              onClick={() => setSelectedResponse(response)}
            >
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium text-sm leading-snug">
                  {response.request}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {response.summary}
                </p>
                <div className="flex gap-2 pt-1">
                  <Badge
                    variant="outline"
                    className={getSuccessColor(response.successRate)}
                  >
                    {response.successRate}% success
                  </Badge>
                  <Badge variant="outline" className="bg-muted text-xs">
                    {response.timesUsed} uses
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Response Detail */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  {selectedResponse.request}
                </h2>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={getSuccessColor(selectedResponse.successRate)}
                  >
                    {selectedResponse.successRate}% Success Rate
                  </Badge>
                  <Badge variant="outline" className="bg-muted">
                    Used {selectedResponse.timesUsed} times
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Recommended Response</h3>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Response
                  </Button>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm leading-relaxed">
                  {selectedResponse.fullResponse}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Rationale</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedResponse.rationale}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">When to Use</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedResponse.context}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Success Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold">
                      {selectedResponse.timesUsed}
                    </div>
                    <div className="text-sm text-muted-foreground">Times Used</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold">
                      {selectedResponse.successRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold">4.2</div>
                    <div className="text-sm text-muted-foreground">Avg Days to Close</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button variant="outline" className="flex-1">
                  Use in Deal
                </Button>
                <Button className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy & Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
