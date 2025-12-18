import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Rocket, Award, Check, X, TrendingUp } from "lucide-react";

interface RecognitionCandidate {
  id: string;
  name: string;
  type: "top_performer" | "breakthrough" | "most_improved";
  reason: string;
  details: string[];
  isRecognized?: boolean;
}

interface RecognitionTabProps {
  currentMonth: string;
  candidates: RecognitionCandidate[];
  recognitionStats: {
    targetPerMonth: string;
    recognizedLast3Months: number;
    dismissedLast3Months: number;
  };
  onReviewDetails: (candidateId: string) => void;
  onRecognize: (candidateId: string) => void;
  onDismiss: (candidateId: string) => void;
}

export function RecognitionTab({
  currentMonth,
  candidates,
  recognitionStats,
  onReviewDetails,
  onRecognize,
  onDismiss,
}: RecognitionTabProps) {
  const getTypeIcon = (type: RecognitionCandidate["type"]) => {
    switch (type) {
      case "top_performer":
        return <Star className="h-5 w-5 text-status-warning" />;
      case "breakthrough":
        return <Rocket className="h-5 w-5 text-primary" />;
      case "most_improved":
        return <TrendingUp className="h-5 w-5 text-status-success" />;
    }
  };

  const getTypeLabel = (type: RecognitionCandidate["type"]) => {
    switch (type) {
      case "top_performer":
        return "Top Performer";
      case "breakthrough":
        return "Breakthrough";
      case "most_improved":
        return "Most Improved";
    }
  };

  const getTypeBadgeStyles = (type: RecognitionCandidate["type"]) => {
    switch (type) {
      case "top_performer":
        return "bg-status-warning/10 text-status-warning border-status-warning/20";
      case "breakthrough":
        return "bg-primary/10 text-primary border-primary/20";
      case "most_improved":
        return "bg-status-success/10 text-status-success border-status-success/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-status-warning" />
            Recognition Opportunities
          </CardTitle>
          <CardDescription>
            System-identified candidates for {currentMonth}. Recognize 2-3 team members per month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Target: {recognitionStats.targetPerMonth}</span>
            <span className="text-border">|</span>
            <span>Last 3 months: {recognitionStats.recognizedLast3Months} recognized, {recognitionStats.dismissedLast3Months} dismissed</span>
          </div>
        </CardContent>
      </Card>

      {/* Candidates */}
      {candidates.length === 0 ? (
        <Card className="p-12 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No candidates this month</h3>
          <p className="text-muted-foreground">
            Check back later for recognition opportunities based on team performance.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className={candidate.isRecognized ? "opacity-60" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${getTypeBadgeStyles(candidate.type)}`}>
                      {getTypeIcon(candidate.type)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{candidate.name}</h3>
                        <Badge variant="outline" className={getTypeBadgeStyles(candidate.type)}>
                          {getTypeLabel(candidate.type)}
                        </Badge>
                        {candidate.isRecognized && (
                          <Badge variant="secondary" className="bg-status-success/10 text-status-success">
                            <Check className="h-3 w-3 mr-1" />
                            Recognized
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{candidate.reason}</p>
                      <ul className="space-y-1">
                        {candidate.details.map((detail, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <span className="text-muted-foreground">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {!candidate.isRecognized && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReviewDetails(candidate.id)}
                      >
                        Review Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onRecognize(candidate.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Recognize
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDismiss(candidate.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Recognition Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Recognition works best when delivered personally, with specific details</p>
          <p>• Use the "Review Details" button for talking points when recognizing team members</p>
          <p>• Aim for variety - recognize different types of achievements across the team</p>
        </CardContent>
      </Card>
    </div>
  );
}
