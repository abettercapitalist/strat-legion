import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const steps = [
  "Basic Info",
  "Add Clauses",
  "Configure Properties",
  "Review & Publish",
];

export default function CreateTemplate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/law/templates")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold">Create New Template</h1>
          <p className="text-muted-foreground mt-1">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={((currentStep + 1) / steps.length) * 100} />
        <div className="flex justify-between text-sm text-muted-foreground">
          {steps.map((step, index) => (
            <span
              key={step}
              className={index <= currentStep ? "text-foreground font-medium" : ""}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Define the core details of your template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Enterprise SaaS Agreement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and use cases for this template..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="procurement">Procurement</SelectItem>
                    <SelectItem value="employment">Employment</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="draft">
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button variant="outline" onClick={() => navigate("/law/templates")}>
                Cancel
              </Button>
              <Button onClick={() => setCurrentStep(1)}>
                Continue to Add Clauses
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <div className="text-center py-16 text-muted-foreground">
          Step 2: Add Clauses - Implementation in progress
          <div className="mt-4 flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setCurrentStep(0)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(2)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="text-center py-16 text-muted-foreground">
          Step 3: Configure Properties - Implementation in progress
          <div className="mt-4 flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(3)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="text-center py-16 text-muted-foreground">
          Step 4: Review & Publish - Implementation in progress
          <div className="mt-4 flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button onClick={() => navigate("/law/templates")}>
              Publish Template
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
