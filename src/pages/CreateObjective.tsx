import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Handshake, Globe, ShieldCheck, DollarSign, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const objectives = [
  {
    id: "acquisition",
    title: "New Customer Acquisition",
    description: "Bring in new revenue from a new client",
    icon: Users,
  },
  {
    id: "expansion",
    title: "Customer Expansion",
    description: "Grow revenue from existing customer",
    icon: TrendingUp,
  },
  {
    id: "partnership",
    title: "Strategic Partnership",
    description: "Create mutual value through collaboration",
    icon: Handshake,
  },
  {
    id: "market-entry",
    title: "Market Entry",
    description: "Enter new market, vertical, or geography",
    icon: Globe,
  },
  {
    id: "cost-reduction",
    title: "Cost Reduction",
    description: "Reduce costs through better vendor terms",
    icon: DollarSign,
  },
  {
    id: "risk-mitigation",
    title: "Risk Mitigation",
    description: "Protect the business through better terms",
    icon: ShieldCheck,
  },
];

export default function CreateObjective() {
  const navigate = useNavigate();
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [expectedValue, setExpectedValue] = useState("");
  const [priority, setPriority] = useState("");

  const handleContinue = () => {
    if (selectedObjective) {
      navigate("/create/template");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold">What's the business objective?</h1>
        <p className="text-lg text-muted-foreground">Great contracts start with clear business goals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {objectives.map((objective) => (
          <Card
            key={objective.id}
            className={`cursor-pointer transition-all border-2 ${
              selectedObjective === objective.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30"
            }`}
            onClick={() => setSelectedObjective(objective.id)}
          >
            <CardHeader className="space-y-4">
              <objective.icon className={`h-8 w-8 ${
                selectedObjective === objective.id ? "text-primary" : "text-muted-foreground"
              }`} />
              <div className="space-y-2">
                <CardTitle className="text-lg">{objective.title}</CardTitle>
                <CardDescription className="text-sm">{objective.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedObjective && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl">Describe the specific business outcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base">What do you want to achieve?</Label>
              <Textarea
                id="description"
                placeholder="Example: Establish enterprise relationship with Fortune 500 company in healthcare vertical, targeting 1,000+ users within first year..."
                className="min-h-[120px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="value" className="text-base">Expected Annual Value</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="value"
                    type="text"
                    placeholder="500,000"
                    className="pl-7"
                    value={expectedValue}
                    onChange={(e) => setExpectedValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="volume" className="text-base">Expected Volume/Users</Label>
                <Input
                  id="volume"
                  type="text"
                  placeholder="1,000"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="priority" className="text-base">Strategic Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button size="lg" onClick={handleContinue}>
                Continue to Template Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
