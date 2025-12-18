import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RBACProvider } from "./contexts/RBACContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LawLayout } from "./components/LawLayout";
import { SalesLayout } from "./components/SalesLayout";
import { AdminLayout } from "./components/AdminLayout";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Law Module Pages
import LawTemplates from "./pages/law/Templates";
import LawCreateTemplate from "./pages/law/CreateTemplate";
import LawClauses from "./pages/law/Clauses";
import LawCreateClause from "./pages/law/CreateClause";
import LawActiveMatters from "./pages/law/ActiveMatters";
import LawMatterReview from "./pages/law/MatterReview";
import LawDashboard from "./pages/law/LearningDashboard";
import LawHome from "./pages/law/Home";
import LawSettings from "./pages/law/Settings";
import LawResponseLibrary from "./pages/law/ResponseLibrary";

// Shared Pages
import SelectPlay from "./pages/SelectPlay";
import CreateWorkstream from "./pages/CreateWorkstream";

// Admin Module Pages
import WorkstreamTypes from "./pages/admin/WorkstreamTypes";
import ApprovalTemplates from "./pages/admin/ApprovalTemplates";
import CreateEditApprovalTemplate from "./pages/admin/CreateEditApprovalTemplate";
import CreatePlaybook from "./pages/admin/CreatePlaybook";

// Sales Module Pages
import SalesHome from "./pages/sales/Home";
import SalesDeals from "./pages/sales/Deals";
import CreateDeal from "./pages/sales/CreateDeal";
import DealDetail from "./pages/sales/DealDetail";
import DealReview from "./pages/sales/DealReview";
import SalesCustomers from "./pages/sales/Customers";
import SalesTargets from "./pages/sales/Targets";
import ResponseLibrary from "./pages/sales/ResponseLibrary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RBACProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            
            {/* Law Module Routes */}
            <Route path="/law" element={<ProtectedRoute><LawLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/law/home" replace />} />
              <Route path="home" element={<LawHome />} />
              <Route path="new" element={<SelectPlay />} />
              <Route path="new/:playId" element={<CreateWorkstream />} />
              <Route path="matters" element={<LawActiveMatters />} />
              <Route path="matters/:id" element={<div className="p-6">Matter Detail - Coming Soon</div>} />
              <Route path="review" element={<LawMatterReview />} />
              <Route path="templates" element={<LawTemplates />} />
              <Route path="templates/new" element={<LawCreateTemplate />} />
              <Route path="templates/:id/edit" element={<LawCreateTemplate />} />
              <Route path="templates/archived" element={<LawTemplates />} />
              <Route path="clauses" element={<LawClauses />} />
              <Route path="clauses/new" element={<LawCreateClause />} />
              <Route path="clauses/:id/edit" element={<LawCreateClause />} />
              <Route path="responses" element={<LawResponseLibrary />} />
              <Route path="dashboard" element={<LawDashboard />} />
              <Route path="settings" element={<LawSettings />} />
            </Route>

            {/* Admin Module Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route path="workstream-types" element={<WorkstreamTypes />} />
              <Route path="workstream-types/new" element={<CreatePlaybook />} />
              <Route path="workstream-types/:id/edit" element={<CreatePlaybook />} />
            </Route>

            {/* Play Library Routes */}
            <Route path="/play-library" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route path="approval-templates" element={<ApprovalTemplates />} />
              <Route path="approval-templates/new" element={<CreateEditApprovalTemplate />} />
              <Route path="approval-templates/:id/edit" element={<CreateEditApprovalTemplate />} />
            </Route>

            {/* Sales Module Routes */}
            <Route path="/sales" element={<ProtectedRoute><SalesLayout /></ProtectedRoute>}>
              <Route index element={<SalesHome />} />
              <Route path="new" element={<SelectPlay />} />
              <Route path="new/:playId" element={<CreateWorkstream />} />
              <Route path="deals" element={<SalesDeals />} />
              <Route path="deals/new" element={<CreateDeal />} />
              <Route path="deals/:id" element={<DealDetail />} />
              <Route path="review" element={<DealReview />} />
              <Route path="customers" element={<SalesCustomers />} />
              <Route path="targets" element={<SalesTargets />} />
              <Route path="responses" element={<ResponseLibrary />} />
              <Route path="settings" element={<div className="text-center py-16 text-muted-foreground">Settings - Coming Soon</div>} />
            </Route>

            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RBACProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
