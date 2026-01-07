import { useState, useEffect } from "react";
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
  Clock,
  AlertTriangle,
  EyeOff,
  Check,
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
      icon: Clock,
      pain: "Waiting for approvals stalls momentum",
      solution: "Embed delegation rules so teams move without escalation",
    },
    {
      icon: AlertTriangle,
      pain: "Inconsistent decisions create risk",
      solution: "Codify institutional judgment into reusable workflows",
    },
    {
      icon: EyeOff,
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
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
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-6">
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -top-10 right-10 w-20 h-20 border border-primary/20 rounded-full" />
          <div className="absolute top-60 left-10 w-8 h-8 bg-primary/20 rounded-full" />
        </div>

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

        {/* Browser Mockup */}
        <div className="max-w-5xl mx-auto mt-16 px-4">
          <div 
            className="relative rounded-xl overflow-hidden shadow-2xl border border-border bg-card"
            style={{ transform: "perspective(1000px) rotateX(2deg)" }}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center max-w-md mx-auto">
                  app.playbook.io/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard mockup content */}
            <div className="p-6 bg-background">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {["Pending", "In Review", "Approved", "Completed"].map((label, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">{label}</div>
                    <div className="text-2xl font-bold">{[12, 8, 24, 156][i]}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((col) => (
                  <div key={col} className="space-y-3">
                    <div className="h-3 w-20 bg-muted/50 rounded" />
                    {[1, 2, 3].map((row) => (
                      <div key={row} className="bg-muted/20 rounded-lg p-3 border border-border/50">
                        <div className="h-2 w-3/4 bg-muted/40 rounded mb-2" />
                        <div className="h-2 w-1/2 bg-muted/30 rounded" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section
        id="problems"
        className={`py-16 md:py-24 px-6 bg-muted/30 transition-all duration-700 ${
          visibleSections.has("problems") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {problems.map((item, index) => (
              <Card key={index} className="bg-card/50 border-border/50 overflow-hidden">
                <CardContent className="pt-6">
                  {/* Pain point */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <item.icon className="h-5 w-5 text-destructive/70" strokeWidth={1.5} />
                    </div>
                    <p className="text-muted-foreground font-serif italic text-sm leading-relaxed">
                      {item.pain}
                    </p>
                  </div>
                  <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent my-4" />
                  {/* Solution */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Check className="h-5 w-5 text-primary" strokeWidth={2} />
                    </div>
                    <p className="font-medium text-sm leading-relaxed">{item.solution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`relative py-16 md:py-24 px-6 transition-all duration-700 ${
          visibleSections.has("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Decorative background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tools designed to operationalize your institutional judgment at scale
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
                  </div>
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
        className={`relative py-16 md:py-24 px-6 bg-muted/30 transition-all duration-700 ${
          visibleSections.has("how-it-works") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          </div>
          
          <div className="relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className="relative text-center md:text-left"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Step number */}
                  <div className="flex justify-center md:justify-start mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/25">
                        {step.number}
                      </div>
                      {/* Decorative ring */}
                      <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '3s' }} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator Section */}
      <section
        id="differentiator"
        className={`relative py-16 md:py-24 px-6 transition-all duration-700 ${
          visibleSections.has("differentiator") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            A new category
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Not another contract tool.
          </h2>
          <p className="text-lg text-muted-foreground font-serif leading-relaxed mb-8">
            Most platforms manage documents. Playbook operationalizes judgment. We help you embed
            the "how we do things here" into systems that scale.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["Encode expertise", "Scale decisions", "Maintain control"].map((tag, i) => (
              <div key={i} className="px-4 py-2 rounded-lg bg-muted text-sm font-medium">
                {tag}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 px-6 border-y border-border bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "10K+", label: "decisions guided" },
              { value: "60%", label: "reduction in escalations" },
              { value: "8hrs", label: "saved weekly" },
            ].map((stat, i) => (
              <div key={i} className="group">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        className={`relative py-16 md:py-24 px-6 transition-all duration-700 ${
          visibleSections.has("cta") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Decorative background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Scale your decisions. See Playbook in action.
          </h2>
          <p className="text-muted-foreground mb-8">
            Request a demo to see how Playbook can transform your operations
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Input type="email" placeholder="Enter your email" className="flex-1" />
            <Button className="shadow-lg shadow-primary/25">Request Demo</Button>
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
