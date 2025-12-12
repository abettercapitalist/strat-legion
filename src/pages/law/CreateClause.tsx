import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClauses } from "@/hooks/useClauses";
import { useToast } from "@/hooks/use-toast";

export default function CreateClause() {
  const navigate = useNavigate();
  const { createClause } = useClauses();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [text, setText] = useState("");
  const [businessContext, setBusinessContext] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !category || !text.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the title, category, and standard text.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await createClause({
        title: title.trim(),
        category,
        text: text.trim(),
        risk_level: riskLevel || "low",
        is_standard: true,
        business_context: businessContext.trim() || null,
      });

      toast({
        title: "Clause created",
        description: `"${title}" has been added to your clause library.`,
      });
      navigate("/law/clauses");
    } catch (err) {
      console.error("Error creating clause:", err);
      toast({
        title: "Error",
        description: "Failed to create clause. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/law/clauses")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold">Create New Clause</h1>
          <p className="text-muted-foreground mt-1">
            Add a reusable clause to your library
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clause Details</CardTitle>
          <CardDescription>
            Define the clause content and business context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="e.g., Payment Terms" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="ip">IP</SelectItem>
                  <SelectItem value="confidentiality">Confidentiality</SelectItem>
                  <SelectItem value="termination">Termination</SelectItem>
                  <SelectItem value="sla">SLA</SelectItem>
                  <SelectItem value="warranty">Warranty</SelectItem>
                  <SelectItem value="regulatory">Regulatory</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk">Risk Level</Label>
            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger id="risk">
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Standard Text *</Label>
            <Textarea
              id="text"
              placeholder="Enter the standard clause text..."
              className="min-h-[150px] resize-none font-mono text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Business Context</Label>
            <Textarea
              id="context"
              placeholder="Explain why we use this language and what risk it addresses..."
              className="min-h-[100px] resize-none"
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => navigate("/law/clauses")} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Clause"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
