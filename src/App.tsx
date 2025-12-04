import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LawLayout } from "./components/LawLayout";
import { SalesLayout } from "./components/SalesLayout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Law Module Pages
import LawTemplates from "./pages/law/Templates";
import LawCreateTemplate from "./pages/law/CreateTemplate";
import LawClauses from "./pages/law/Clauses";
import LawCreateClause from "./pages/law/CreateClause";
import LawChangeRequests from "./pages/law/ChangeRequests";
import LawDashboard from "./pages/law/LearningDashboard";
import LawHome from "./pages/law/Home";

// Sales Module Pages
import SalesDeals from "./pages/sales/Deals";
import CreateDeal from "./pages/sales/CreateDeal";
import DealDetail from "./pages/sales/DealDetail";
import SalesApprovals from "./pages/sales/Approvals";
import ResponseLibrary from "./pages/sales/ResponseLibrary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Law Module Routes */}
            <Route path="/law" element={<ProtectedRoute><LawLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/law/home" replace />} />
              <Route path="home" element={<LawHome />} />
              <Route path="templates" element={<LawTemplates />} />
              <Route path="templates/new" element={<LawCreateTemplate />} />
              <Route path="templates/:id/edit" element={<LawCreateTemplate />} />
              <Route path="templates/archived" element={<LawTemplates />} />
              <Route path="clauses" element={<LawClauses />} />
              <Route path="clauses/new" element={<LawCreateClause />} />
              <Route path="clauses/:id/edit" element={<LawCreateClause />} />
              <Route path="requests" element={<LawChangeRequests />} />
              <Route path="requests/approved" element={<LawChangeRequests />} />
              <Route path="requests/rejected" element={<LawChangeRequests />} />
              <Route path="dashboard" element={<LawDashboard />} />
              <Route path="settings" element={<div className="text-center py-16 text-muted-foreground">Settings - Coming Soon</div>} />
            </Route>

            {/* Sales Module Routes */}
            <Route path="/sales" element={<ProtectedRoute><SalesLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/sales/deals" replace />} />
              <Route path="deals" element={<SalesDeals />} />
              <Route path="deals/all" element={<SalesDeals />} />
              <Route path="deals/new" element={<CreateDeal />} />
              <Route path="deals/:id" element={<DealDetail />} />
              <Route path="deals/closed" element={<SalesDeals />} />
              <Route path="approvals" element={<SalesApprovals />} />
              <Route path="approvals/history" element={<SalesApprovals />} />
              <Route path="responses" element={<ResponseLibrary />} />
              <Route path="pipeline" element={<div className="text-center py-16 text-muted-foreground">Pipeline Dashboard - Coming Soon</div>} />
              <Route path="pipeline/forecast" element={<div className="text-center py-16 text-muted-foreground">Forecast - Coming Soon</div>} />
              <Route path="settings" element={<div className="text-center py-16 text-muted-foreground">Settings - Coming Soon</div>} />
            </Route>

            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
