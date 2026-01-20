# Playbook Database Schema Reference

> **Generated**: 2025-01-20  
> **Purpose**: Complete database context for Claude Code development  
> **Database**: Lovable Cloud (Supabase)  
> **Project ID**: labxxxrjmlxwngekosym

---

## Table of Contents

1. [Enums](#enums)
2. [Tables](#tables)
3. [Database Functions](#database-functions)
4. [Row-Level Security Policies](#row-level-security-policies)
5. [Indexes](#indexes)
6. [Triggers](#triggers)
7. [Edge Functions](#edge-functions)
8. [Data Relationships](#data-relationships)

---

## Enums

### app_role

Legacy role enum for backward compatibility with initial role system.

```sql
CREATE TYPE app_role AS ENUM (
  'general_counsel',
  'legal_ops',
  'contract_counsel',
  'account_executive',
  'sales_manager',
  'finance_reviewer'
);
```

**Usage Notes**:
- Used in `user_roles.role` column
- Being phased out in favor of `custom_roles` table
- Helper functions like `has_role()` still reference this enum

---

## Tables

### approval_decisions

Records individual approval/rejection decisions made by approvers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `approval_id` | uuid | NO | - | FK to workstream_approvals |
| `decision` | text | NO | - | 'approved', 'rejected', 'escalated' |
| `reasoning` | text | YES | - | Free-text justification |
| `decision_factors` | jsonb | YES | - | Structured metadata, AI-inferred tags |
| `decided_by` | uuid | YES | - | FK to auth.users |
| `created_at` | timestamptz | NO | now() | Decision timestamp |

**JSONB Structure - decision_factors**:
```json
{
  "prompt_shown": true,
  "prompt_submitted": false,
  "ai_suggested_tags": ["high_value", "complex_negotiation"],
  "selected_factors": ["deal_size", "counterparty_risk"],
  "free_text_feedback": "Customer requires special handling..."
}
```

---

### approval_templates

Defines reusable approval workflow configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `name` | text | NO | - | Template name |
| `description` | text | YES | - | Template description |
| `approval_sequence` | jsonb | NO | '[]'::jsonb | Ordered approval gates |
| `trigger_conditions` | jsonb | YES | - | When this template applies |
| `is_active` | boolean | YES | true | Whether template is active |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |
| `company_id` | uuid | YES | - | Multi-tenancy (future) |
| `status` | text | YES | 'draft' | 'draft', 'active', 'archived' |
| `created_by` | uuid | YES | - | FK to auth.users |

**JSONB Structure - approval_sequence**:
```json
[
  {
    "gate": 1,
    "name": "Manager Review",
    "approver_role": "sales_manager",
    "required_approvals": 1,
    "sla_hours": 24,
    "auto_approve_conditions": {
      "max_value": 50000,
      "counterparty_types": ["existing_customer"]
    }
  },
  {
    "gate": 2,
    "name": "Legal Review",
    "approver_role": "contract_counsel",
    "required_approvals": 1,
    "sla_hours": 48
  }
]
```

---

### clause_alternatives

Alternative text options for standard clauses.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `clause_id` | uuid | NO | - | FK to clauses |
| `alternative_text` | text | NO | - | Alternative clause language |
| `use_case` | text | YES | - | When to use this alternative |
| `business_impact` | text | YES | - | Business implications |
| `created_at` | timestamptz | NO | now() | Created timestamp |

---

### clauses

Standard contract clause library.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `title` | text | NO | - | Clause title |
| `category` | text | NO | - | Category (e.g., 'Liability', 'Payment') |
| `text` | text | NO | - | Full clause text |
| `risk_level` | text | YES | 'low' | 'low', 'medium', 'high' |
| `is_standard` | boolean | YES | true | Whether this is a standard clause |
| `business_context` | text | YES | - | Business explanation |
| `created_by` | uuid | YES | - | FK to auth.users |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

---

### content_tags

Polymorphic tagging system linking tags to various content types.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `content_type` | text | NO | - | 'approval_decision', 'workstream', etc. |
| `content_id` | uuid | NO | - | ID of tagged content |
| `tag_id` | uuid | NO | - | FK to tags |
| `tagged_by` | uuid | YES | - | FK to auth.users |
| `confidence` | double precision | YES | - | AI confidence score (0.0-1.0) |
| `created_at` | timestamptz | NO | now() | Created timestamp |

---

### counterparties

Customer/vendor entities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `name` | text | NO | - | Company name |
| `entity_type` | text | YES | - | 'Corporation', 'LLC', 'Partnership' |
| `state_of_formation` | text | YES | - | State/country of incorporation |
| `relationship_status` | text | YES | 'prospect' | 'prospect', 'active', 'churned' |
| `counterparty_type` | text | YES | 'customer' | 'customer', 'vendor', 'partner' |
| `primary_contact_name` | text | YES | - | Primary contact name |
| `primary_contact_email` | text | YES | - | Primary contact email |
| `primary_contact_phone` | text | YES | - | Primary contact phone |
| `address` | text | YES | - | Business address |
| `notes` | text | YES | - | Free-text notes |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

---

### custom_roles

Configurable role definitions for the new RBAC system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `name` | text | NO | - | Role identifier (unique) |
| `display_name` | text | YES | - | Human-readable name |
| `description` | text | YES | - | Role description |
| `is_system_role` | boolean | NO | false | Cannot be deleted if true |
| `is_work_routing` | boolean | NO | false | Can receive work assignments |
| `is_manager_role` | boolean | NO | false | Has manager privileges |
| `parent_id` | uuid | YES | - | Parent role for hierarchy |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

---

### decision_outcomes

Tracks outcomes of approval decisions for learning.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `approval_decision_id` | uuid | NO | - | FK to approval_decisions |
| `workstream_id` | uuid | NO | - | FK to workstreams |
| `outcome` | text | NO | - | 'success', 'failure', 'escalated' |
| `outcome_time` | timestamptz | YES | - | When outcome occurred |
| `outcome_notes` | text | YES | - | Notes about outcome |
| `created_at` | timestamptz | NO | now() | Created timestamp |

---

### needs

Work items requiring action (approvals, documents, tasks).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `workstream_id` | uuid | NO | - | FK to workstreams |
| `source_type` | text | NO | - | 'workflow', 'approval', 'manual' |
| `source_id` | uuid | YES | - | ID of source (step, approval) |
| `source_reason` | text | YES | - | Why this need exists |
| `need_type` | text | NO | - | 'approval', 'document', 'information', 'task' |
| `description` | text | NO | - | Description of what's needed |
| `satisfier_type` | text | YES | 'role' | 'role' or 'custom_role' |
| `satisfier_role` | text | YES | - | Role ID or name that can satisfy |
| `status` | text | NO | 'open' | 'open', 'satisfied', 'cancelled' |
| `required_before` | text | YES | - | Stage gate (e.g., 'signature') |
| `due_at` | timestamptz | YES | - | When need is due |
| `satisfied_at` | timestamptz | YES | - | When need was satisfied |
| `satisfied_by` | uuid | YES | - | FK to auth.users |
| `satisfaction_reference_type` | text | YES | - | Type of satisfying record |
| `satisfaction_reference_id` | uuid | YES | - | ID of satisfying record |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

---

### permissions

Fine-grained permission definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | text | NO | - | Permission identifier (PK) |
| `name` | text | NO | - | Human-readable name |
| `description` | text | YES | - | Permission description |
| `module` | text | NO | - | Module grouping |
| `created_at` | timestamptz | NO | now() | Created timestamp |

---

### profiles

User profile data (mirrors auth.users).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | - | PK, FK to auth.users |
| `email` | text | YES | - | User email |
| `full_name` | text | YES | - | Display name |
| `title` | text | YES | - | Job title |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

---

### response_library

Reusable response templates for common customer questions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `title` | text | NO | - | Response title |
| `response_text` | text | NO | - | Full response text |
| `category` | text | YES | - | Category grouping |
| `tags` | text[] | YES | - | Array of tag strings |
| `success_rate` | numeric | YES | - | Calculated effectiveness |
| `usage_count` | integer | YES | 0 | Times used |
| `created_by` | uuid | YES | - | FK to auth.users |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

---

### response_usage

Tracks usage and effectiveness of responses.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `response_library_id` | uuid | NO | - | FK to response_library |
| `workstream_id` | uuid | NO | - | FK to workstreams |
| `customer_question` | text | YES | - | Original question |
| `response_sent` | text | YES | - | Response that was sent |
| `customer_reaction` | text | YES | - | Customer's response |
| `effectiveness_rating` | integer | YES | - | 1-5 rating |
| `context_notes` | text | YES | - | Usage context notes |
| `used_by` | uuid | YES | - | FK to auth.users |
| `created_at` | timestamptz | NO | now() | Created timestamp |

---

### role_permissions

Maps permissions to custom roles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `role_id` | uuid | NO | - | FK to custom_roles |
| `permission_id` | text | NO | - | FK to permissions |
| `created_at` | timestamptz | NO | now() | Created timestamp |

**Unique Constraint**: (role_id, permission_id)

---

### tags

Tag definitions for the content tagging system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `tag_name` | text | NO | - | Tag identifier |
| `tag_category` | text | YES | - | Category grouping |
| `description` | text | YES | - | Tag description |
| `usage_count` | integer | YES | 0 | Times used |
| `company_id` | uuid | YES | - | Multi-tenancy (future) |
| `created_by` | uuid | YES | - | FK to auth.users |
| `created_at` | timestamptz | NO | now() | Created timestamp |

**Unique Constraint**: (company_id, tag_name)

---

### team_members

User membership in teams.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `team_id` | uuid | NO | - | FK to teams |
| `user_id` | uuid | NO | - | FK to auth.users |
| `role_in_team` | text | YES | 'member' | 'member', 'lead' |
| `created_at` | timestamptz | NO | now() | Created timestamp |

**Unique Constraint**: (team_id, user_id)

---

### teams

Team/group definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `name` | text | NO | - | Team identifier (unique) |
| `display_name` | text | NO | - | Human-readable name |
| `description` | text | YES | - | Team description |
| `is_default` | boolean | YES | false | Default team flag |
| `parent_id` | uuid | YES | - | Parent team for hierarchy |
| `created_by` | uuid | YES | - | FK to auth.users |
| `created_at` | timestamptz | YES | now() | Created timestamp |

---

### template_clauses

Maps clauses to templates (junction table).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `template_id` | uuid | NO | - | FK to templates |
| `clause_id` | uuid | NO | - | FK to clauses |
| `position` | integer | NO | - | Order in template |
| `is_locked` | boolean | YES | false | Cannot be removed |
| `alternatives_allowed` | boolean | YES | true | Allow alternatives |
| `approval_required_from` | text | YES | - | Role required for changes |
| `created_at` | timestamptz | NO | now() | Created timestamp |

---

### templates

Document templates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `name` | text | NO | - | Template name |
| `category` | text | NO | - | Template category |
| `version` | text | YES | 'v1.0' | Version string |
| `status` | text | YES | 'Draft' | 'Draft', 'Active', 'Archived' |
| `content` | text | YES | - | Full template content |
| `workstream_type_id` | uuid | YES | - | FK to workstream_types |
| `created_by` | uuid | YES | - | FK to auth.users |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

---

### user_custom_roles

User assignments to custom roles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `user_id` | uuid | NO | - | FK to auth.users |
| `role_id` | uuid | NO | - | FK to custom_roles |
| `role_in_group` | text | YES | 'member' | 'member', 'admin' |
| `created_at` | timestamptz | NO | now() | Created timestamp |

---

### user_customizations

Per-user UI preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `user_id` | uuid | NO | - | FK to auth.users |
| `sports_theme` | text | YES | 'baseball' | UI theme preference |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

---

### user_roles

User assignments to legacy app_roles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `user_id` | uuid | NO | - | FK to auth.users |
| `role` | app_role | NO | - | Legacy role enum |
| `created_at` | timestamptz | NO | now() | Created timestamp |

---

### workstream_activity

Activity log for workstreams.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `workstream_id` | uuid | NO | - | FK to workstreams |
| `activity_type` | text | NO | - | Activity type identifier |
| `description` | text | NO | - | Human-readable description |
| `actor_id` | uuid | YES | - | FK to auth.users |
| `metadata` | jsonb | YES | '{}'::jsonb | Additional context |
| `created_at` | timestamptz | NO | now() | Created timestamp |

**Activity Types**:
- `created`, `updated`, `stage_changed`
- `approval_submitted`, `approval_completed`
- `document_uploaded`, `document_signed`
- `comment_added`, `need_satisfied`

---

### workstream_approvals

Active approval workflow instances.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `workstream_id` | uuid | YES | - | FK to workstreams |
| `approval_template_id` | uuid | YES | - | FK to approval_templates |
| `status` | text | YES | 'pending' | 'pending', 'approved', 'rejected' |
| `current_gate` | integer | YES | 1 | Current approval gate |
| `approves_step_ids` | text[] | YES | '{}' | Step IDs this approval gates |
| `submitted_at` | timestamptz | YES | now() | When submitted for approval |
| `completed_at` | timestamptz | YES | - | When fully approved/rejected |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

---

### workstream_steps

Workflow step instances (TO BE REPLACED BY BRICK ARCHITECTURE).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `workstream_id` | uuid | NO | - | FK to workstreams |
| `step_id` | text | NO | - | Step identifier |
| `step_type` | text | NO | - | Step type (see below) |
| `position` | integer | NO | 0 | Order in workflow |
| `status` | text | NO | 'pending' | 'pending', 'in_progress', 'completed', 'skipped' |
| `requirement_type` | text | NO | 'required_immediate' | When required |
| `required_before` | text | YES | - | Gate dependency |
| `trigger_timing` | text | YES | - | When to trigger |
| `config` | jsonb | YES | '{}'::jsonb | Step-specific config |
| `completed_at` | timestamptz | YES | - | Completion timestamp |
| `completed_by` | uuid | YES | - | FK to auth.users |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

**Current Step Types** (hardcoded):
- `request_information` - Collect information from user
- `approval_gate` - Require approval before proceeding
- `task_assignment` - Assign task to role
- `generate_document` - Generate document from template

**JSONB Structure - config**:
```json
{
  "title": "Get Tax ID",
  "description": "Collect customer's tax identification number",
  "fields": [
    {"name": "tax_id", "label": "Tax ID", "type": "text", "required": true}
  ],
  "approver_role": "finance_reviewer",
  "sla_hours": 24
}
```

---

### workstream_types

Play definitions (workflow templates) - the "playbook" of plays.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `name` | text | NO | - | Play identifier |
| `display_name` | text | YES | - | Human-readable name |
| `description` | text | YES | - | Play description |
| `team_category` | text | YES | - | 'Sales', 'Legal', etc. |
| `status` | text | YES | 'Draft' | 'Draft', 'Active', 'Archived' |
| `required_documents` | text[] | YES | '{}' | Required document types |
| `default_needs` | jsonb | YES | '[]'::jsonb | Auto-created needs |
| `default_workflow` | text | YES | - | JSON workflow definition |
| `approval_template_id` | uuid | YES | - | FK to approval_templates |
| `auto_approval_config` | jsonb | YES | - | Auto-approval rules |
| `play_approval_config` | jsonb | YES | - | Who can approve play usage |
| `created_by` | uuid | YES | - | FK to auth.users |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

**JSONB Structure - default_workflow**:
```json
{
  "steps": [
    {
      "id": "collect_customer_info",
      "type": "request_information",
      "position": 1,
      "requirement_type": "required_immediate",
      "config": {
        "title": "Customer Information",
        "fields": [...]
      }
    },
    {
      "id": "manager_approval",
      "type": "approval_gate",
      "position": 2,
      "requirement_type": "required_before",
      "required_before": "signature",
      "config": {
        "approver_role": "sales_manager",
        "sla_hours": 24
      }
    }
  ]
}
```

---

### workstreams

Active deals/matters - the main business entity.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `name` | text | NO | - | Workstream name |
| `workstream_type_id` | uuid | YES | - | FK to workstream_types (play) |
| `template_id` | uuid | YES | - | FK to templates |
| `counterparty_id` | uuid | YES | - | FK to counterparties |
| `owner_id` | uuid | YES | - | FK to auth.users |
| `tier` | text | YES | 'standard' | 'fast_track', 'standard', 'complex' |
| `stage` | text | YES | 'draft' | See stages below |
| `business_objective` | text | YES | - | Business goal description |
| `annual_value` | numeric | YES | - | Annual contract value |
| `expected_close_date` | date | YES | - | Target close date |
| `actual_close_date` | date | YES | - | Actual close date |
| `notes` | text | YES | - | Free-text notes |
| `created_at` | timestamptz | NO | now() | Created timestamp |
| `updated_at` | timestamptz | NO | now() | Last updated |

**Stages**:
1. `draft` - Initial creation
2. `intake` - Gathering information
3. `pending_approval` - Awaiting approvals
4. `approved` - All approvals complete
5. `negotiation` - In negotiation with counterparty
6. `signature` - Awaiting signatures
7. `completed` - Fully executed
8. `cancelled` - Cancelled/abandoned

---

## Database Functions

### get_role_members

Returns user IDs for all members of a custom role.

```sql
CREATE OR REPLACE FUNCTION public.get_role_members(role_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id FROM public.user_custom_roles WHERE role_id = role_uuid;
$$;
```

---

### get_user_role

Returns legacy app_role for a user (first match).

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;
```

---

### get_user_role_ids

Returns array of all custom role IDs for a user.

```sql
CREATE OR REPLACE FUNCTION public.get_user_role_ids(_user_id uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  role_ids uuid[];
BEGIN
  SELECT array_agg(role_id) INTO role_ids
  FROM user_custom_roles
  WHERE user_id = _user_id;
  
  RETURN COALESCE(role_ids, ARRAY[]::uuid[]);
END;
$$;
```

---

### get_user_work_routing_roles

Returns array of custom role IDs that can receive work assignments.

```sql
CREATE OR REPLACE FUNCTION public.get_user_work_routing_roles(_user_id uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  role_ids uuid[];
BEGIN
  SELECT array_agg(cr.id) INTO role_ids
  FROM user_custom_roles ucr
  JOIN custom_roles cr ON ucr.role_id = cr.id
  WHERE ucr.user_id = _user_id AND cr.is_work_routing = true;
  
  RETURN COALESCE(role_ids, ARRAY[]::uuid[]);
END;
$$;
```

---

### handle_new_user

Trigger function to create profile when auth user is created.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, title)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'title', '')
  );
  
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'role')::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

### has_business_role

Checks if user has any business role (can create workstreams).

```sql
CREATE OR REPLACE FUNCTION public.has_business_role(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
  ) THEN
    RETURN true;
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM public.user_custom_roles ucr
    JOIN public.custom_roles cr ON cr.id = ucr.role_id
    WHERE ucr.user_id = _user_id
    AND cr.is_work_routing = true
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;
```

---

### has_permission

Checks if user has a specific permission via custom roles.

```sql
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_custom_roles ucr
    JOIN public.role_permissions rp ON rp.role_id = ucr.role_id
    WHERE ucr.user_id = _user_id
      AND rp.permission_id = _permission_id
  )
$$;
```

---

### has_role

Checks if user has a specific legacy app_role.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

---

### has_role_or_custom_role

Checks for either legacy or custom role membership.

```sql
CREATE OR REPLACE FUNCTION public.has_role_or_custom_role(
  _user_id uuid, 
  legacy_role app_role DEFAULT NULL, 
  custom_role_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF legacy_role IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = legacy_role
  ) THEN
    RETURN true;
  END IF;
  
  IF custom_role_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_custom_roles ucr
    WHERE ucr.user_id = _user_id AND ucr.role_id = custom_role_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;
```

---

### has_workstream_access

Checks if user can access a workstream.

```sql
CREATE OR REPLACE FUNCTION public.has_workstream_access(ws_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN 
    -- User is owner
    EXISTS (
      SELECT 1 FROM public.workstreams WHERE id = ws_id AND owner_id = _user_id
    ) 
    OR 
    -- User has assigned need matching their role
    EXISTS (
      SELECT 1 FROM public.needs n
      JOIN public.user_roles ur ON ur.user_id = _user_id
      WHERE n.workstream_id = ws_id 
        AND n.satisfier_role = ur.role::text
        AND n.status = 'open'
    )
    OR 
    -- User is a manager
    public.is_manager(_user_id);
END;
$$;
```

---

### is_manager

Checks if user has manager privileges.

```sql
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
    AND ur.role IN ('general_counsel', 'legal_ops', 'sales_manager')
  ) THEN
    RETURN true;
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM public.user_custom_roles ucr
    JOIN public.custom_roles cr ON cr.id = ucr.role_id
    WHERE ucr.user_id = _user_id
    AND cr.is_manager_role = true
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;
```

---

### is_manager_for_scope

Checks if user is a manager for a specific role scope.

```sql
CREATE OR REPLACE FUNCTION public.is_manager_for_scope(
  _user_id uuid DEFAULT auth.uid(), 
  scope_role_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_is_manager boolean := false;
  user_role_ids uuid[];
BEGIN
  SELECT array_agg(cr.id) INTO user_role_ids
  FROM user_custom_roles ucr
  JOIN custom_roles cr ON ucr.role_id = cr.id
  WHERE ucr.user_id = _user_id AND cr.is_manager_role = true;

  IF user_role_ids IS NULL OR array_length(user_role_ids, 1) IS NULL THEN
    RETURN false;
  END IF;

  IF scope_role_id IS NULL THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM custom_roles scope_role
    WHERE scope_role.id = scope_role_id
    AND (
      scope_role.id = ANY(user_role_ids)
      OR scope_role.parent_id = ANY(user_role_ids)
    )
  );
END;
$$;
```

---

### is_role_member

Checks if user is member of a specific custom role.

```sql
CREATE OR REPLACE FUNCTION public.is_role_member(role_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_custom_roles ucr
    WHERE ucr.role_id = role_uuid AND ucr.user_id = user_uuid
  );
END;
$$;
```

---

### update_updated_at_column

Trigger function to auto-update `updated_at` timestamp.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

---

## Row-Level Security Policies

### approval_decisions

| Policy | Command | Expression |
|--------|---------|------------|
| Authorized users can create decisions | INSERT | `WITH CHECK (is_manager(auth.uid()) OR (decided_by = auth.uid()))` |
| Users can view relevant decisions | SELECT | `USING ((decided_by = auth.uid()) OR is_manager(auth.uid()) OR (workstream owner check))` |

### approval_templates

| Policy | Command | Expression |
|--------|---------|------------|
| Law users can manage approval_templates | ALL | `USING (has_role(auth.uid(), 'general_counsel') OR has_role(auth.uid(), 'legal_ops') OR has_role(auth.uid(), 'contract_counsel'))` |
| Law users can view approval_templates | SELECT | Same as above |

### clause_alternatives

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Law users can manage | ALL | `USING (has_role(auth.uid(), 'general_counsel'/'legal_ops'/'contract_counsel'))` |

### clauses

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Law users can create | INSERT | `WITH CHECK (law role check)` |
| Law users can update | UPDATE | `USING (law role check)` |
| Law users can delete | DELETE | `USING (law role check)` |

### content_tags

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can create | INSERT | `WITH CHECK (auth.uid() IS NOT NULL)` |
| Users can view relevant | SELECT | `USING ((tagged_by = auth.uid()) OR is_manager(auth.uid()))` |
| Authorized users can update | UPDATE | `USING ((tagged_by = auth.uid()) OR is_manager(auth.uid()))` |
| Authorized users can delete | DELETE | `USING ((tagged_by = auth.uid()) OR is_manager(auth.uid()))` |

### counterparties

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view related | SELECT | `USING (is_manager OR has workstream access)` |
| Business roles can create | INSERT | `WITH CHECK (has_business_role(auth.uid()))` |
| Authorized users can update | UPDATE | `USING (is_manager OR owner of related workstream)` |
| Managers can delete | DELETE | `USING (is_manager(auth.uid()))` |

### custom_roles

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Admins can manage | ALL | `USING (has_role 'general_counsel' OR 'legal_ops')` |

### decision_outcomes

| Policy | Command | Expression |
|--------|---------|------------|
| Managers can create | INSERT | `WITH CHECK (is_manager(auth.uid()))` |
| Users can view relevant | SELECT | `USING (is_manager OR owner OR decider)` |

### needs

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view relevant | SELECT | Complex: is_manager OR satisfied_by self OR owns workstream OR role matches |
| Owners and managers can create | INSERT | `WITH CHECK (is_manager OR owns workstream)` |
| Authorized users can update | UPDATE | Complex: is_manager OR satisfied_by self OR owns workstream OR role matches |
| Owners and managers can delete | DELETE | `USING (is_manager OR owns workstream)` |

### permissions

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |

### profiles

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view own | SELECT | `USING (auth.uid() = id)` |
| Users can insert own | INSERT | `WITH CHECK (auth.uid() = id)` |
| Users can update own | UPDATE | `USING (auth.uid() = id)` |

### response_library

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Law users can manage | ALL | `USING (law role check)` |

### response_usage

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view relevant | SELECT | `USING (used_by self OR is_manager OR owns workstream)` |
| Users can log | INSERT | `WITH CHECK (has_workstream_access(workstream_id))` |
| Users can update own | UPDATE | `USING (used_by = auth.uid())` |
| Authorized users can delete | DELETE | `USING (used_by self OR is_manager)` |

### role_permissions

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Admins can manage | ALL | `USING (has_role 'general_counsel' OR 'legal_ops')` |

### tags

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Law users can manage | ALL | `USING (law role check)` |

### team_members

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (auth.uid() IS NOT NULL)` |
| Managers can insert | INSERT | `WITH CHECK (is_manager(auth.uid()))` |
| Managers can update | UPDATE | `USING (is_manager(auth.uid()))` |
| Managers can delete | DELETE | `USING (is_manager(auth.uid()))` |

### teams

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Managers can create | INSERT | `WITH CHECK (is_manager(auth.uid()))` |

### template_clauses

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Law users can manage | ALL | `USING (law role check)` |

### templates

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Law users can create | INSERT | `WITH CHECK (law role check)` |
| Law users can update | UPDATE | `USING (law role check)` |
| Law users can delete | DELETE | `USING (law role check)` |

### user_custom_roles

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Admins can manage | ALL | `USING (has_role 'general_counsel' OR 'legal_ops')` |

### user_customizations

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view own | SELECT | `USING (auth.uid() = user_id)` |
| Users can create own | INSERT | `WITH CHECK (auth.uid() = user_id)` |
| Users can update own | UPDATE | `USING (auth.uid() = user_id)` |

### user_roles

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view own | SELECT | `USING (auth.uid() = user_id)` |

### workstream_activity

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view accessible | SELECT | `USING (has_workstream_access(workstream_id))` |
| Participants can log | INSERT | `WITH CHECK (has_workstream_access(workstream_id))` |

### workstream_approvals

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view relevant | SELECT | `USING (is_manager OR has_workstream_access)` |
| Owners and managers can create | INSERT | `WITH CHECK (is_manager OR owns workstream)` |
| Managers can update | UPDATE | `USING (is_manager(auth.uid()))` |
| Managers can delete | DELETE | `USING (is_manager(auth.uid()))` |

### workstream_steps

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view accessible | SELECT | `USING (has_workstream_access(workstream_id))` |
| Owners and managers can create | INSERT | `WITH CHECK (is_manager OR owns workstream)` |
| Authorized users can update | UPDATE | `USING (has_workstream_access(workstream_id))` |
| Owners and managers can delete | DELETE | `USING (is_manager OR owns workstream)` |

### workstream_types

| Policy | Command | Expression |
|--------|---------|------------|
| Authenticated users can view | SELECT | `USING (true)` |
| Law users can manage | ALL | `USING (law role check)` |

### workstreams

| Policy | Command | Expression |
|--------|---------|------------|
| Users can view accessible | SELECT | `USING (has_workstream_access(id))` |
| Business roles can create | INSERT | `WITH CHECK (has_business_role(auth.uid()))` |
| Owners and managers can update | UPDATE | `USING ((owner_id = auth.uid()) OR is_manager(auth.uid()))` |
| Managers can delete | DELETE | `USING (is_manager(auth.uid()))` |

---

## Indexes

### Primary Key Indexes (22 tables)
All tables have `{table}_pkey` indexes on `id` column.

### Custom Indexes

```sql
-- approval_templates
CREATE UNIQUE INDEX approval_templates_company_name_idx 
  ON approval_templates (company_id, name) WHERE company_id IS NOT NULL;

-- content_tags
CREATE INDEX content_tags_content_idx ON content_tags (content_type, content_id);
CREATE INDEX content_tags_tag_idx ON content_tags (tag_id);
CREATE INDEX content_tags_type_idx ON content_tags (content_type);

-- custom_roles
CREATE UNIQUE INDEX custom_roles_name_key ON custom_roles (name);
CREATE INDEX idx_custom_roles_parent_id ON custom_roles (parent_id);
CREATE INDEX idx_custom_roles_work_routing ON custom_roles (is_work_routing) WHERE is_work_routing = true;

-- needs
CREATE INDEX idx_needs_need_type ON needs (need_type);
CREATE INDEX idx_needs_satisfier_role ON needs (satisfier_role);
CREATE INDEX idx_needs_status ON needs (status);
CREATE INDEX idx_needs_workstream_id ON needs (workstream_id);

-- role_permissions
CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key 
  ON role_permissions (role_id, permission_id);

-- tags
CREATE UNIQUE INDEX tags_company_id_tag_name_key ON tags (company_id, tag_name);

-- team_members
CREATE UNIQUE INDEX team_members_team_id_user_id_key ON team_members (team_id, user_id);

-- teams
CREATE INDEX idx_teams_parent_id ON teams (parent_id);
CREATE UNIQUE INDEX teams_name_key ON teams (name);

-- user_custom_roles
CREATE UNIQUE INDEX user_custom_roles_user_id_role_id_key ON user_custom_roles (user_id, role_id);

-- user_roles
CREATE UNIQUE INDEX user_roles_user_id_role_key ON user_roles (user_id, role);

-- workstream_steps
CREATE INDEX idx_workstream_steps_status ON workstream_steps (status);
CREATE INDEX idx_workstream_steps_workstream_id ON workstream_steps (workstream_id);

-- workstreams
CREATE INDEX idx_workstreams_counterparty_id ON workstreams (counterparty_id);
CREATE INDEX idx_workstreams_owner_id ON workstreams (owner_id);
CREATE INDEX idx_workstreams_stage ON workstreams (stage);
CREATE INDEX idx_workstreams_type_id ON workstreams (workstream_type_id);
```

---

## Triggers

### update_updated_at Triggers

Applied to tables with `updated_at` column:

```sql
CREATE TRIGGER update_clauses_updated_at
  BEFORE UPDATE ON clauses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON custom_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_needs_updated_at
  BEFORE UPDATE ON needs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_library_updated_at
  BEFORE UPDATE ON response_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_customizations_updated_at
  BEFORE UPDATE ON user_customizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workstream_approvals_updated_at
  BEFORE UPDATE ON workstream_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workstream_steps_updated_at
  BEFORE UPDATE ON workstream_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Edge Functions

Located in `supabase/functions/`

### check-tagging-prompt

Determines whether to show a tagging prompt after approval decisions.

**Endpoint**: `POST /functions/v1/check-tagging-prompt`

**Request**:
```typescript
interface Request {
  decision_id?: string;
  get_acceptance_rate?: boolean;
}
```

**Response**:
```typescript
interface Response {
  shouldPrompt: boolean;
  context?: {
    reason: string;
    similar_decisions_count: number;
  };
  acceptance_rate?: number;
}
```

---

### create-approvals-from-template

Creates approval workflow instances from workstream_type configuration.

**Endpoint**: `POST /functions/v1/create-approvals-from-template`

**Request**:
```typescript
interface Request {
  workstream_id: string;
}
```

**Response**:
```typescript
interface Response {
  success: boolean;
  created_count: number;
  auto_approved_count: number;
  skipped_count: number;
  approvals: Array<{
    id: string;
    step_id: string;
    status: string;
  }>;
}
```

---

### create-needs-from-template

Creates need records from workstream_type configuration.

**Endpoint**: `POST /functions/v1/create-needs-from-template`

**Request**:
```typescript
interface Request {
  workstream_id: string;
}
```

**Response**:
```typescript
interface Response {
  success: boolean;
  needs_created: number;
  needs: Array<{
    id: string;
    need_type: string;
    description: string;
  }>;
}
```

---

### match-clauses

AI-powered clause matching between documents and clause library.

**Endpoint**: `POST /functions/v1/match-clauses`

**Request**:
```typescript
interface Request {
  blocks: Array<{
    id: string;
    text: string;
    section?: string;
  }>;
  clauses: Array<{
    id: string;
    title: string;
    text: string;
    category: string;
  }>;
}
```

**Response**:
```typescript
interface Response {
  results: Array<{
    block_id: string;
    action: 'exact_match' | 'similar' | 'no_match' | 'needs_review';
    matches: Array<{
      clause_id: string;
      similarity: number;
      explanation: string;
    }>;
  }>;
}
```

---

### parse-document

Extracts structured data from uploaded documents.

**Endpoint**: `POST /functions/v1/parse-document`

**Request**:
```typescript
interface Request {
  fileContent: string;  // base64
  fileName: string;
  fileType: string;
}
```

**Response**:
```typescript
interface Response {
  document_type: string;
  parties: Array<{ name: string; role: string }>;
  clauses: Array<{ title: string; text: string; category: string }>;
  definitions: Record<string, string>;
  summary: string;
}
```

---

### process-approval-decision

Handles approval decision recording and state transitions.

**Endpoint**: `POST /functions/v1/process-approval-decision`

**Request**:
```typescript
interface Request {
  approval_id: string;
  decision: 'approved' | 'rejected' | 'escalated';
  reasoning?: string;
  decision_factors?: Record<string, any>;
}
```

**Response**:
```typescript
interface Response {
  success: boolean;
  decision_id: string;
  approval_status: string;
  workstream_stage?: string;
  tags_applied: string[];
}
```

---

### seed-users

Creates test users for development (disabled in production).

**Endpoint**: `POST /functions/v1/seed-users`

**Request**: None required

**Response**:
```typescript
interface Response {
  success: boolean;
  users_created: number;
}
```

---

### submit-manual-tags

Processes user-submitted tags for approval decisions.

**Endpoint**: `POST /functions/v1/submit-manual-tags`

**Request**:
```typescript
interface Request {
  decision_id: string;
  selected_factors?: string[];
  free_text?: string;
  skipped?: boolean;
}
```

**Response**:
```typescript
interface Response {
  success: boolean;
  tags_created: string[];
  acceptance_rate: number;
}
```

---

## Data Relationships

### Entity Relationship Summary

```
auth.users (Supabase managed)
    ├── profiles (1:1)
    ├── user_roles (1:many) → app_role enum
    ├── user_custom_roles (1:many) → custom_roles
    └── team_members (1:many) → teams

custom_roles
    ├── parent_id → custom_roles (self-reference for hierarchy)
    ├── role_permissions (1:many) → permissions
    └── user_custom_roles (1:many) → users

workstream_types (Plays)
    ├── templates (1:many)
    ├── approval_templates (many:1)
    └── workstreams (1:many)

workstreams
    ├── counterparties (many:1)
    ├── workstream_type_id → workstream_types
    ├── template_id → templates
    ├── owner_id → auth.users
    ├── workstream_steps (1:many)
    ├── workstream_approvals (1:many)
    ├── workstream_activity (1:many)
    └── needs (1:many)

workstream_approvals
    ├── workstream_id → workstreams
    ├── approval_template_id → approval_templates
    └── approval_decisions (1:many)

templates
    ├── template_clauses (1:many) → clauses
    └── workstream_type_id → workstream_types

clauses
    ├── clause_alternatives (1:many)
    └── template_clauses (1:many) → templates

tags
    └── content_tags (1:many) → polymorphic content

response_library
    └── response_usage (1:many)
```

---

## Notes for Brick Architecture Migration

### Tables to Create

1. **bricks** - System-defined atomic operations (73 types)
2. **brick_categories** - Grouping for bricks
3. **step_definitions** - User-created step templates composed of bricks
4. **step_definition_bricks** - Junction table for step→brick composition

### Tables to Modify

1. **workstream_steps**
   - Add: `step_definition_id uuid REFERENCES step_definitions(id)`
   - Deprecate: `step_type` (replace with brick composition)
   - Keep: `config` (for runtime values)

2. **workstream_types**
   - Modify: `default_workflow` to reference step_definitions

### Migration Strategy

1. Create new tables with RLS policies
2. Populate brick catalog (73 entries)
3. Migrate existing step_types to step_definitions
4. Update workstream_steps to use step_definition_id
5. Update workstream_types default_workflow format
6. Update edge functions to use brick execution engine

---

*End of Schema Reference*
