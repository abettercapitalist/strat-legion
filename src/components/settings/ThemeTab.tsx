import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme, SportsTheme, themeLabels } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const themeOptions: { value: SportsTheme; label: string; icon: string; description: string }[] = [
  { 
    value: "baseball", 
    label: "Baseball", 
    icon: "⚾", 
    description: "Plays, At-Bats, Innings - classic American pastime terminology"
  },
  { 
    value: "basketball", 
    label: "Basketball", 
    icon: "🏀", 
    description: "Possessions, Quarters, Film Sessions - fast-paced court action"
  },
  { 
    value: "football", 
    label: "Football", 
    icon: "🏈", 
    description: "Drives, Downs, Touchdowns - strategic gridiron language"
  },
  { 
    value: "soccer", 
    label: "Soccer", 
    icon: "⚽", 
    description: "Attacks, Chances, Goals - the beautiful game"
  },
  { 
    value: "hockey", 
    label: "Hockey", 
    icon: "🏒", 
    description: "Rushes, Shots, Periods - fast and furious on ice"
  },
  { 
    value: "golf", 
    label: "Golf", 
    icon: "⛳", 
    description: "Rounds, Holes, Birdies - precision and patience"
  },
];

export function ThemeTab() {
  const { sportsTheme, setSportsTheme, isLoading } = useTheme();

  const handleThemeChange = async (value: string) => {
    await setSportsTheme(value as SportsTheme);
    toast.success(`Theme updated to ${value}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentLabels = themeLabels[sportsTheme];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sports Theme</CardTitle>
          <CardDescription>
            Choose a sports metaphor to personalize your experience. This changes the language used throughout the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={sportsTheme}
            onValueChange={handleThemeChange}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {themeOptions.map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className="flex flex-col items-start gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-semibold">{option.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your chosen theme affects the language in the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Workstreams</p>
              <p className="font-medium">{currentLabels.workstreams}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Deals</p>
              <p className="font-medium">{currentLabels.deals}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Matters</p>
              <p className="font-medium">{currentLabels.matters}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Performance Review</p>
              <p className="font-medium">{currentLabels.performanceReview}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-muted-foreground mb-2">Stage Names</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(currentLabels.stageNames).map(([key, value]) => (
                <span 
                  key={key} 
                  className="inline-flex items-center rounded-full border px-3 py-1 text-sm"
                >
                  <span className="text-muted-foreground mr-2 capitalize">{key}:</span>
                  <span className="font-medium">{value}</span>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
