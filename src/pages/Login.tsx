import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Briefcase, UserCheck, Calculator } from "lucide-react";
import { useUser, UserRole } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/PB-Logo.png";

const roles = [
  {
    id: "law" as UserRole,
    name: "Sarah Chen",
    title: "General Counsel",
    description: "Manage templates, clauses, and change requests",
    icon: Scale,
  },
  {
    id: "sales" as UserRole,
    name: "John Smith",
    title: "Account Executive",
    description: "Create deals and manage negotiations",
    icon: Briefcase,
  },
  {
    id: "manager" as UserRole,
    name: "David Lee",
    title: "Sales Manager",
    description: "Review and approve deals",
    icon: UserCheck,
  },
  {
    id: "finance" as UserRole,
    name: "Rachel Adams",
    title: "Finance Reviewer",
    description: "Approve financial terms",
    icon: Calculator,
  },
];

export default function Login() {
  const { login } = useUser();
  const navigate = useNavigate();

  const handleLogin = (role: UserRole) => {
    login(role);
    
    // Navigate based on role
    if (role === "law") {
      navigate("/law/templates");
    } else {
      navigate("/sales/deals");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <img src={logo} alt="Playbook" className="h-12 w-auto mx-auto" />
          <h1 className="text-3xl font-semibold text-foreground">
            Welcome to Playbook
          </h1>
          <p className="text-muted-foreground">
            Select a role to continue (MVP Prototype)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => handleLogin(role.id)}
            >
              <CardHeader className="space-y-4">
                <role.icon className="h-10 w-10 text-primary" />
                <div className="space-y-2">
                  <CardTitle className="text-xl">{role.name}</CardTitle>
                  <CardDescription className="text-sm font-medium text-foreground">
                    {role.title}
                  </CardDescription>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Sign in as {role.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
