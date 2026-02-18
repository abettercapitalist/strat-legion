# Playbook (strat-legion) — Current State

## Project Structure

```
src/
├── App.tsx                          # Root router
├── main.tsx                         # Entry point
├── components/
│   ├── admin/
│   │   ├── workflow-builder/        # DAG play designer (ReactFlow-based)
│   │   │   ├── BrickNode.tsx        # Custom node renderer
│   │   │   ├── WorkflowCanvas.tsx   # Main canvas component
│   │   │   ├── WorkflowCanvasSection.tsx
│   │   │   ├── NodeConfigPanel.tsx  # Right panel for node settings
│   │   │   ├── NodePalette.tsx      # Draggable brick palette
│   │   │   ├── edges/              # Custom edge renderers
│   │   │   ├── forms/              # Per-brick-type config forms
│   │   │   ├── hooks/              # useWorkflowDAG, useWorkflowPersistence, useAutoLayout, useWorkflowValidation
│   │   │   ├── types.ts
│   │   │   ├── outputSchemas.ts
│   │   │   ├── upstreamContext.ts   # Upstream data flow resolution
│   │   │   ├── templateAnalysis.ts  # Template variable gap analysis
│   │   │   └── autoConfig.ts
│   │   ├── ValidationSummaryPanel.tsx
│   │   ├── PlayFormStepper.tsx
│   │   ├── PlayApprovalSection.tsx
│   │   └── (role/team comboboxes, tier config, etc.)
│   ├── approvals/
│   │   ├── ApprovalDecisionModal.tsx
│   │   └── TaggingPromptBanner.tsx
│   ├── contracts/
│   │   ├── ContractPreview.tsx
│   │   ├── ClauseModificationModal.tsx
│   │   └── NegotiationTab.tsx
│   ├── dashboard/
│   │   ├── UnifiedNeedsDashboard.tsx  # Kanban needs view (shared Law + Sales)
│   │   ├── MetricRing.tsx
│   │   ├── VisualBreakdown.tsx
│   │   ├── WorkloadHistoryMini.tsx
│   │   ├── NeedKanbanCard.tsx
│   │   └── NeedLaneHeader.tsx
│   ├── editor/
│   │   ├── ContractEditor.tsx         # TipTap-based template editor
│   │   ├── EditorToolbar.tsx
│   │   ├── SaveTemplateDialog.tsx
│   │   └── extensions/               # Custom TipTap extensions
│   │       ├── SectionNumbering.ts
│   │       ├── EnumeratedList.ts
│   │       ├── CrossReference.ts
│   │       ├── Columns.ts
│   │       ├── FontSize.ts
│   │       ├── FontWeight.ts
│   │       ├── LineHeight.ts
│   │       └── Indent.ts
│   ├── templates/
│   │   ├── ClauseLibrarySidebar.tsx
│   │   ├── ClauseMatchingModal.tsx    # AI-powered clause matching
│   │   └── DocumentUploadModal.tsx
│   ├── wizard/                        # Workstream creation wizard steps
│   ├── workstream/
│   │   ├── brick-forms/               # Runtime brick action forms
│   │   └── step-modals/
│   ├── filters/
│   │   └── NeedsFilterBar.tsx
│   ├── settings/                      # Roles, users, permissions, theme tabs
│   ├── ui/                            # shadcn/ui primitives
│   ├── LawLayout.tsx / LawSidebar.tsx
│   ├── SalesLayout.tsx / SalesSidebar.tsx
│   ├── AdminLayout.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   ├── AuthContext.tsx
│   ├── RBACContext.tsx
│   ├── ThemeContext.tsx               # Sports-themed label system
│   ├── UserContext.tsx
│   └── WorkstreamWizardContext.tsx
├── hooks/
│   ├── useUnifiedNeeds.ts             # Needs dashboard data
│   ├── useApprovalWorkflow.ts
│   ├── useApprovalDecision.ts
│   ├── usePlayExecution.ts            # DAG node execution
│   ├── useNodeExecutionStates.ts
│   ├── usePlaybookPlays.ts
│   ├── useWorkflowNodes.ts
│   ├── useWorkstreamTypes.ts
│   ├── useTemplates.ts
│   ├── useClauses.ts
│   ├── useDeals.ts
│   ├── useNeeds.ts / useNeedsFilter.ts
│   ├── useCurrentUserRole.ts
│   ├── usePermissions.ts
│   ├── useRoles.ts
│   ├── useTeams.ts
│   ├── useAutoSave.ts
│   ├── useTaggingPrompt.ts
│   └── useActivityLogger.ts
├── lib/
│   ├── bricks/                        # Brick execution engine
│   │   ├── engine.ts                  # Topological sort, DAG runner
│   │   ├── engine/utilities.ts
│   │   ├── registry.ts               # Brick type registry
│   │   ├── types.ts
│   │   ├── executors/                 # Per-type executors
│   │   │   ├── collection.ts
│   │   │   ├── review.ts
│   │   │   ├── approval.ts
│   │   │   ├── documentation.ts
│   │   │   └── commitment.ts
│   │   └── services/
│   │       ├── playExecutor.ts        # Orchestrates play execution
│   │       └── supabase.ts            # DB operations for engine
│   ├── api/documentParser.ts          # Unstructured.io integration
│   ├── clauseMatching.ts
│   ├── approvalUtils.ts
│   └── featureRegistry.ts
├── pages/
│   ├── law/
│   │   ├── Home.tsx
│   │   ├── Templates.tsx
│   │   ├── CreateTemplate.tsx         # Full editor page
│   │   ├── Clauses.tsx
│   │   ├── CreateClause.tsx
│   │   ├── ActiveMatters.tsx
│   │   ├── MatterReview.tsx           # Stubbed (mock data)
│   │   ├── LearningDashboard.tsx      # Stubbed (mock data)
│   │   ├── ResponseLibrary.tsx        # Stubbed (mock data)
│   │   ├── ChangeRequests.tsx         # Stubbed (no route)
│   │   └── Settings.tsx
│   ├── sales/
│   │   ├── Home.tsx
│   │   ├── Deals.tsx
│   │   ├── CreateDeal.tsx
│   │   ├── DealDetail.tsx             # Dead prototype (real detail is WorkstreamDetail)
│   │   ├── DealReview.tsx             # Stubbed (mock data)
│   │   ├── Approvals.tsx              # Wired to real data
│   │   ├── Customers.tsx              # Stubbed (mock data)
│   │   ├── Targets.tsx                # Stubbed (mock data)
│   │   └── ResponseLibrary.tsx        # Stubbed (mock data)
│   ├── admin/
│   │   ├── WorkstreamTypes.tsx        # Play list
│   │   └── CreatePlaybook.tsx         # DAG designer page
│   ├── lab/
│   │   └── SuperDocPoc.tsx            # SuperDoc editor evaluation
│   ├── WorkstreamDetail.tsx           # Shared matter/deal detail (real data)
│   ├── CreateWorkstream.tsx           # Shared creation wizard
│   ├── SelectPlay.tsx
│   ├── Auth.tsx
│   ├── Landing.tsx
│   └── NotFound.tsx
├── integrations/supabase/
│   ├── client.ts
│   └── types.ts                       # Generated DB types
└── types/
    └── autoApproval.ts

supabase/
├── config.toml
├── migrations/                        # 40+ migrations (Dec 2024 – Feb 2026)
└── functions/
    ├── generate-document/index.ts     # Template → DOCX/PDF generation
    ├── parse-document/index.ts        # Unstructured.io document parsing
    ├── match-clauses/index.ts         # AI clause matching
    ├── process-approval-decision/     # Advance approval gates + tagging
    ├── check-tagging-prompt/          # Novelty-based tag prompt check
    ├── submit-manual-tags/            # Save tags (+ Anthropic inference)
    ├── create-approvals-from-template/
    ├── create-needs-from-template/
    ├── export-template/
    └── seed-users/
```

---

## Database Schema

### Core Workflow Tables

| Table | Key Columns | Foreign Keys |
|-------|-------------|--------------|
| **workstreams** | id, name, workstream_type_id, playbook_id, play_id, current_node_ids (UUID[]), stage, status, annual_value, tier | → workstream_types, playbooks, playbook_plays, counterparties, templates |
| **workstream_types** | id, name, display_name, approval_template_id, default_workflow, required_documents | → approval_templates |
| **playbooks** | id, name, display_name, workstream_type_id, is_template, version | → workstream_types |
| **playbook_patterns** | id, playbook_id, pattern_type (sequential\|parallel\|conditional\|loop), position, trigger_conditions | → playbooks |
| **playbook_plays** | id, pattern_id, playbook_id, name, display_name, position, sla_hours | → playbook_patterns, playbooks |
| **workflow_nodes** | id, play_id, node_type (start\|brick\|fork\|join\|end\|decision), brick_id, config (JSON), position_x/y | → playbook_plays |
| **workflow_edges** | id, play_id, source_node_id, target_node_id, edge_type, condition (JSON) | → playbook_plays, workflow_nodes × 2 |
| **node_execution_state** | id, workstream_id, play_id, node_id, status (pending\|running\|completed\|failed\|skipped), inputs/outputs (JSON) | → playbook_plays, workflow_nodes |

### Brick/Step Tables

| Table | Key Columns | Foreign Keys |
|-------|-------------|--------------|
| **bricks** | id, name (unique), display_name, category_id, brick_number, input_schema, output_schema | → brick_categories |
| **brick_categories** | id, name, display_name, display_order, icon | — |
| **step_definitions** | id, name, display_name, workstream_type_id, is_system, is_template | → workstream_types |
| **step_definition_bricks** | id, step_definition_id, brick_id, position, input_config, output_mapping | → step_definitions, bricks |

5 brick types: **collection**, **review**, **approval**, **documentation**, **commitment**

### Approval Tables

| Table | Key Columns | Foreign Keys |
|-------|-------------|--------------|
| **approval_templates** | id, name, approval_sequence (JSON), trigger_conditions, is_active | → profiles |
| **workstream_approvals** | id, workstream_id, approval_template_id, status, current_gate | → workstreams, approval_templates |
| **approval_decisions** | id, approval_id, decision, decision_factors (JSON), reasoning, decided_by | → workstream_approvals, profiles |
| **decision_outcomes** | id, approval_decision_id, workstream_id, outcome, outcome_notes | → approval_decisions, workstreams |

### Document/Template Tables

| Table | Key Columns | Foreign Keys |
|-------|-------------|--------------|
| **templates** | id, name, category, content (HTML), workstream_type_id, status, version | → profiles, workstream_types |
| **template_clauses** | id, template_id, clause_id, position, is_locked, alternatives_allowed | → templates, clauses |
| **clauses** | id, title, text, category, risk_level, is_standard, business_context | → profiles |
| **clause_alternatives** | id, clause_id, alternative_text, business_impact, use_case | → clauses |
| **workstream_documents** | id, workstream_id, template_id, title, document_type, status, file_format, storage_path | → workstreams, templates |

### User/Auth Tables

| Table | Key Columns | Foreign Keys |
|-------|-------------|--------------|
| **profiles** | id, email, full_name, title | — |
| **roles** | id, name, display_name, is_system_role, is_manager_role, parent_id | → roles (self) |
| **user_roles** | id, user_id, role_id | → roles |
| **permissions** | id, name, category, module | — |
| **role_permissions** | id, role_id, permission_id | → roles, permissions |
| **teams** | id, name, display_name, parent_id, is_default | → teams (self) |

### Other Tables

| Table | Key Columns | Foreign Keys |
|-------|-------------|--------------|
| **counterparties** | id, name, business_domain, counterparty_type, entity_type, primary_contact_name/email/phone | — |
| **needs** | id, workstream_id, need_type, source_type, status | → workstreams |
| **workstream_steps** | id, workstream_id, step_type, status, position | → workstreams, profiles |
| **workstream_activity** | id, workstream_id, activity_type, description, actor_id, metadata | → workstreams, profiles |
| **response_library** | id, title, response_text, category, tags[], success_rate, usage_count | → profiles |
| **response_usage** | id, workstream_id, response_library_id, effectiveness_rating | → workstreams, response_library |
| **tags** | id, tag_name, tag_category, usage_count | → profiles |
| **content_tags** | id, tag_id, content_id, content_type, confidence | → tags, profiles |
| **user_customizations** | id, user_id, sports_theme | — |
| **libraries** | id, name, library_type (system\|organization\|user), owner_id | — |
| **library_artifacts** | id, library_id, name, artifact_type, content (JSON), version, tags[] | → libraries |
| **library_templates** | id, library_id, name, template_type, content (JSON), parameters (JSON) | → libraries |

### Key Relationship Chains

- **Workflow execution**: workstreams → playbooks → playbook_plays → workflow_nodes/edges → node_execution_state
- **Approval flow**: workstream_approvals → approval_templates → approval_decisions → decision_outcomes
- **Document generation**: templates → template_clauses → clauses (+ alternatives) → workstream_documents
- **User permissions**: profiles → user_roles → roles → role_permissions → permissions

---

## Workflow/Designer Components

### DAG Play Designer (Admin)
- `src/components/admin/workflow-builder/WorkflowCanvas.tsx` — ReactFlow canvas
- `src/components/admin/workflow-builder/BrickNode.tsx` — custom node renderer
- `src/components/admin/workflow-builder/NodeConfigPanel.tsx` — right-side config panel
- `src/components/admin/workflow-builder/NodePalette.tsx` — draggable brick palette
- `src/components/admin/workflow-builder/forms/` — per-brick-type forms (Collection, Review, Approval, Documentation, Commitment)
- `src/components/admin/workflow-builder/hooks/useWorkflowDAG.ts` — DAG state management
- `src/components/admin/workflow-builder/hooks/useWorkflowPersistence.ts` — save/load to DB
- `src/components/admin/workflow-builder/hooks/useWorkflowValidation.ts` — validation rules
- `src/components/admin/workflow-builder/hooks/useAutoLayout.ts` — dagre-based auto-layout
- `src/components/admin/workflow-builder/upstreamContext.ts` — data flow between nodes
- `src/components/admin/workflow-builder/templateAnalysis.ts` — template variable gap analysis

### Brick Execution Engine (Runtime)
- `src/lib/bricks/engine.ts` — topological sort, DAG runner
- `src/lib/bricks/services/playExecutor.ts` — orchestrates play execution
- `src/lib/bricks/services/supabase.ts` — DB operations for engine
- `src/lib/bricks/executors/` — per-type: collection, review, approval, documentation, commitment
- `src/lib/bricks/registry.ts` — brick type registry
- `src/hooks/usePlayExecution.ts` — React hook for play execution
- `src/hooks/useNodeExecutionStates.ts` — tracks node states
- `src/hooks/useWorkflowNodes.ts` — fetches workflow graph

---

## Current Routes (from App.tsx)

### Public
| Path | Component |
|------|-----------|
| `/` | Landing |
| `/landing` | Landing |
| `/auth` | Auth |
| `/login` | → redirect to `/auth` |
| `/lab/superdoc` | SuperDocPoc (lazy) |

### Law Module (protected, LawLayout)
| Path | Component |
|------|-----------|
| `/law` | → redirect to `/law/home` |
| `/law/home` | LawHome |
| `/law/new` | SelectPlay (module=law) |
| `/law/new/:playId` | CreateWorkstream (module=law) |
| `/law/matters` | LawActiveMatters |
| `/law/matters/:id` | WorkstreamDetail (module=law) |
| `/law/review` | LawMatterReview |
| `/law/templates` | LawTemplates |
| `/law/templates/new` | LawCreateTemplate |
| `/law/templates/:id/edit` | LawCreateTemplate |
| `/law/templates/archived` | LawTemplates |
| `/law/clauses` | LawClauses |
| `/law/clauses/new` | LawCreateClause |
| `/law/clauses/:id/edit` | LawCreateClause |
| `/law/responses` | LawResponseLibrary |
| `/law/dashboard` | LawLearningDashboard |
| `/law/settings` | LawSettings |

### Sales Module (protected, SalesLayout)
| Path | Component |
|------|-----------|
| `/sales` | SalesHome |
| `/sales/new` | SelectPlay (module=sales) |
| `/sales/new/:playId` | CreateWorkstream (module=sales) |
| `/sales/deals` | SalesDeals |
| `/sales/deals/new` | CreateDeal |
| `/sales/:id` | WorkstreamDetail (module=sales) |
| `/sales/review` | DealReview |
| `/sales/customers` | SalesCustomers |
| `/sales/targets` | SalesTargets |
| `/sales/responses` | ResponseLibrary |
| `/sales/settings` | Coming Soon placeholder |

### Admin Module (protected, AdminLayout)
| Path | Component |
|------|-----------|
| `/admin/workstream-types` | WorkstreamTypes |
| `/admin/workstream-types/new` | CreatePlaybook (lazy) |
| `/admin/workstream-types/:id/edit` | CreatePlaybook (lazy) |

---

## Key Dependencies

### Framework
- react 18.3, react-dom 18.3, react-router-dom 6.30

### Data & Auth
- @supabase/supabase-js 2.87
- @tanstack/react-query 5.83
- react-hook-form 7.61, zod 3.25

### UI
- TailwindCSS + shadcn/ui (30+ @radix-ui primitives)
- lucide-react 0.462 (icons)
- recharts 2.15 (charts)
- sonner 1.7 (toasts)
- cmdk 1.1 (command palette)
- embla-carousel-react 8.6
- react-resizable-panels 2.1

### Editor
- @tiptap/react 3.12 + 10 extensions (table, color, font-family, highlight, text-align, text-style)
- 8 custom extensions: SectionNumbering, EnumeratedList, CrossReference, Columns, FontSize, FontWeight, LineHeight, Indent
- @superdoc-dev/react 1.0.0-rc.2 (PoC evaluation)

### Workflow Visualization
- @xyflow/react 12.10 (ReactFlow — DAG designer)
- @dagrejs/dagre 2.0 (auto-layout)

### Drag & Drop
- @dnd-kit/core 6.3, @dnd-kit/sortable 10.0

### Document Processing
- mammoth 1.11 (DOCX → HTML import, client-side)
- Edge functions use: docx (DOCX generation), pdf-lib (PDF generation), Unstructured.io API (document parsing)

### Other
- date-fns 3.6, uuid 13.0, class-variance-authority 0.7, clsx 2.1, tailwind-merge 2.6

---

## External API Integrations

| Service | Used In | Purpose |
|---------|---------|---------|
| **Unstructured.io** | `parse-document` edge function | PDF/DOCX text extraction |
| **Lovable AI Gateway** | `parse-document`, `match-clauses` edge functions | Clause parsing and semantic matching |
| **Anthropic API** | `submit-manual-tags` edge function | Tag inference from free text |

---

## What's Real vs Stubbed

### Fully functional (real data)
- Auth + RBAC, workstream creation wizard, active matters/deals lists + detail views
- Play execution engine (DAG-based, 5 brick types)
- Approval workflow (multi-gate, tagging, decision outcomes)
- Template editor (TipTap + 8 custom extensions) with clause library
- Document generation (template → DOCX/PDF) and import (mammoth + Unstructured.io)
- Admin play designer (visual DAG builder with ReactFlow)
- Unified needs dashboard (Kanban)

### Stubbed (UI built, hardcoded mock data)
- Law Home: draft templates widget, clauses needing attention, workload history, pipeline breakdown
- Sales Home: pipeline chart, activity trend, target progress, "Welcome back, John"
- Sales Customers, Sales Targets — entirely mock
- Law/Sales MatterReview / DealReview — all mock analytics
- Law/Sales Response Libraries — mock data, no CRUD
- Law Learning Dashboard — all mock
- Law Change Requests — built but not routed
- Sales Settings — "Coming Soon" div
