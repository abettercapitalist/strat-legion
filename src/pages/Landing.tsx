import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  GitBranch,
  Library,
  Users,
  TrendingUp,
  Shield,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import PBLogo from "@/assets/PB-Logo.png";

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("section[id]").forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: LayoutDashboard,
      title: "Unified Dashboard",
      description: "Kanban-style visibility into all active needs",
    },
    {
      icon: GitBranch,
      title: "Smart Workflows",
      description: "Guided processes that encode your institutional judgment",
    },
    {
      icon: Library,
      title: "Response Library",
      description: "Standardized responses and terms for consistency",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Legal and Sales aligned in one workspace",
    },
    {
      icon: TrendingUp,
      title: "Learning Dashboard",
      description: "Pattern analysis to improve decision quality",
    },
    {
      icon: Shield,
      title: "Role-based Access",
      description: "Granular permissions for safe delegation",
    },
  ];

  const problems = [
    {
      pain: "Waiting for approvals stalls momentum",
      solution: "Embed delegation rules so teams move without escalation",
    },
    {
      pain: "Inconsistent decisions create risk",
      solution: "Codify institutional judgment into reusable workflows",
    },
    {
      pain: "No visibility into judgment quality",
      solution: "Surface decision patterns in real-time dashboards",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Define Your Plays",
      description: "Turn your commercial, legal, and risk judgment into reusable workflows",
    },
    {
      number: "02",
      title: "Empower Your Teams",
      description: "Let teams self-coordinate within clear boundaries you set",
    },
    {
      number: "03",
      title: "Maintain Visibility",
      description: "See decisions in real-time without becoming the bottleneck",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : ""
        }`}
      >
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={PBLogo} alt="Playbook" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/auth">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-b border-border px-6 py-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("features")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                How It Works
              </button>
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/auth">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Business-first corporate management
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 font-serif leading-relaxed">
            Playbook is a corporate management platform intended to help companies make consistent,
            high-quality decisions by embedding their commercial, legal, and risk judgment directly
            into everyday work.
          </p>
          <Button size="lg" onClick={() => scrollToSection("how-it-works")} className="gap-2">
            See How It Works
            <ChevronRight size={18} />
          </Button>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section
        id="problems"
        className={`py-16 md:py-24 px-6 bg-muted/30 transition-opacity duration-700 ${
          visibleSections.has("problems") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {problems.map((item, index) => (
              <div key={index} className="space-y-4">
                <p className="text-muted-foreground font-serif italic">{item.pain}</p>
                <div className="h-px bg-border" />
                <p className="font-medium">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`py-16 md:py-24 px-6 transition-opacity duration-700 ${
          visibleSections.has("features") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tools designed to operationalize your institutional judgment at scale
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 hover:border-border transition-colors">
                <CardContent className="pt-6">
                  <feature.icon className="h-10 w-10 text-primary mb-4" strokeWidth={1.5} />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className={`py-16 md:py-24 px-6 bg-muted/30 transition-opacity duration-700 ${
          visibleSections.has("how-it-works") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-muted-foreground/20 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiator Section */}
      <section
        id="differentiator"
        className={`py-16 md:py-24 px-6 transition-opacity duration-700 ${
          visibleSections.has("differentiator") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Not another contract tool. A new category.
          </h2>
          <p className="text-lg text-muted-foreground font-serif leading-relaxed">
            Most platforms manage documents. Playbook operationalizes judgment. We help you embed
            the "how we do things here" into systems that scale.
          </p>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 px-6 border-y border-border bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-muted-foreground">—</div>
              <div className="text-sm text-muted-foreground mt-1">decisions guided</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-muted-foreground">—%</div>
              <div className="text-sm text-muted-foreground mt-1">reduction in escalations</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-muted-foreground">—</div>
              <div className="text-sm text-muted-foreground mt-1">hours saved weekly</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        className={`py-16 md:py-24 px-6 transition-opacity duration-700 ${
          visibleSections.has("cta") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Scale your decisions. See Playbook in action.
          </h2>
          <p className="text-muted-foreground mb-8">
            Request a demo to see how Playbook can transform your operations
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Input type="email" placeholder="Enter your email" className="flex-1" />
            <Button>Request Demo</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Or{" "}
            <Link to="/auth" className="text-primary hover:underline">
              get started now
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={PBLogo} alt="Playbook" className="h-6 w-auto opacity-60" />
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Playbook. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
