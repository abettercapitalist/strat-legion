import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SportsTheme = "none" | "baseball" | "basketball" | "football" | "soccer" | "hockey" | "golf";

interface ThemeLabels {
  // General labels
  workstream: string;
  workstreams: string;
  deal: string;
  deals: string;
  matter: string;
  matters: string;
  
  // Stages
  stageNames: {
    draft: string;
    negotiation: string;
    approval: string;
    signature: string;
    closed: string;
  };
  
  // Actions
  actionVerb: string; // e.g., "Pitch", "Shoot", "Pass"
  
  // Performance
  performanceReview: string;
  engagement: string;
  atBats: string; // opportunities/attempts
  hits: string; // successes
}

const themeLabels: Record<SportsTheme, ThemeLabels> = {
  none: {
    workstream: "Workstream",
    workstreams: "Workstreams",
    deal: "Deal",
    deals: "Deals",
    matter: "Matter",
    matters: "Matters",
    stageNames: {
      draft: "Draft",
      negotiation: "Negotiation",
      approval: "Approval",
      signature: "Signature",
      closed: "Closed",
    },
    actionVerb: "Start",
    performanceReview: "Review",
    engagement: "Engagement",
    atBats: "Opportunities",
    hits: "Wins",
  },
  baseball: {
    workstream: "Play",
    workstreams: "Plays",
    deal: "At-Bat",
    deals: "At-Bats",
    matter: "Inning",
    matters: "Innings",
    stageNames: {
      draft: "On Deck",
      negotiation: "At Bat",
      approval: "Rounding Bases",
      signature: "Heading Home",
      closed: "Run Scored",
    },
    actionVerb: "Pitch",
    performanceReview: "Tape",
    engagement: "Batting Average",
    atBats: "At-Bats",
    hits: "Hits",
  },
  basketball: {
    workstream: "Play",
    workstreams: "Plays",
    deal: "Possession",
    deals: "Possessions",
    matter: "Quarter",
    matters: "Quarters",
    stageNames: {
      draft: "Inbound",
      negotiation: "Driving",
      approval: "At the Rim",
      signature: "Shooting",
      closed: "Score",
    },
    actionVerb: "Assist",
    performanceReview: "Film",
    engagement: "Shooting %",
    atBats: "Shots",
    hits: "Buckets",
  },
  football: {
    workstream: "Drive",
    workstreams: "Drives",
    deal: "Down",
    deals: "Downs",
    matter: "Quarter",
    matters: "Quarters",
    stageNames: {
      draft: "Huddle",
      negotiation: "Snap",
      approval: "Advancing",
      signature: "Red Zone",
      closed: "Touchdown",
    },
    actionVerb: "Handoff",
    performanceReview: "Film",
    engagement: "Completion %",
    atBats: "Attempts",
    hits: "Completions",
  },
  soccer: {
    workstream: "Attack",
    workstreams: "Attacks",
    deal: "Chance",
    deals: "Chances",
    matter: "Half",
    matters: "Halves",
    stageNames: {
      draft: "Midfield",
      negotiation: "Buildup",
      approval: "Final Third",
      signature: "On Target",
      closed: "Goal",
    },
    actionVerb: "Pass",
    performanceReview: "Review",
    engagement: "Conversion Rate",
    atBats: "Shots",
    hits: "Goals",
  },
  hockey: {
    workstream: "Rush",
    workstreams: "Rushes",
    deal: "Shot",
    deals: "Shots",
    matter: "Period",
    matters: "Periods",
    stageNames: {
      draft: "Breakout",
      negotiation: "Neutral Zone",
      approval: "Offensive Zone",
      signature: "Scoring Chance",
      closed: "Goal",
    },
    actionVerb: "Feed",
    performanceReview: "Review",
    engagement: "Save %",
    atBats: "Shots on Goal",
    hits: "Goals",
  },
  golf: {
    workstream: "Round",
    workstreams: "Rounds",
    deal: "Hole",
    deals: "Holes",
    matter: "Nine",
    matters: "Nines",
    stageNames: {
      draft: "Tee Box",
      negotiation: "Fairway",
      approval: "Approach",
      signature: "On the Green",
      closed: "Holed Out",
    },
    actionVerb: "Tee Up",
    performanceReview: "Scorecard",
    engagement: "GIR %",
    atBats: "Strokes",
    hits: "Birdies",
  },
};

interface ThemeContextValue {
  sportsTheme: SportsTheme;
  setSportsTheme: (theme: SportsTheme) => Promise<void>;
  labels: ThemeLabels;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sportsTheme, setSportsThemeState] = useState<SportsTheme>("none");
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from database on mount
  useEffect(() => {
    async function loadTheme() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_customizations")
          .select("sports_theme")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading theme:", error);
        }

        if (data?.sports_theme) {
          setSportsThemeState(data.sports_theme as SportsTheme);
        }
      } catch (err) {
        console.error("Error loading theme:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTheme();
  }, [user]);

  const setSportsTheme = async (theme: SportsTheme) => {
    setSportsThemeState(theme);

    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_customizations")
        .upsert(
          { user_id: user.id, sports_theme: theme },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Error saving theme:", error);
      }
    } catch (err) {
      console.error("Error saving theme:", err);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        sportsTheme,
        setSportsTheme,
        labels: themeLabels[sportsTheme],
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { themeLabels };
