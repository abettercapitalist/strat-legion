
-- Create workstream_types table
CREATE TABLE public.workstream_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  required_documents TEXT[] DEFAULT '{}',
  default_workflow TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create counterparties table
CREATE TABLE public.counterparties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  entity_type TEXT,
  state_of_formation TEXT,
  relationship_status TEXT DEFAULT 'prospect',
  counterparty_type TEXT DEFAULT 'customer',
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approval_templates table
CREATE TABLE public.approval_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  approval_sequence JSONB NOT NULL DEFAULT '[]',
  trigger_conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workstreams table
CREATE TABLE public.workstreams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  workstream_type_id UUID REFERENCES public.workstream_types(id),
  template_id UUID REFERENCES public.templates(id),
  counterparty_id UUID REFERENCES public.counterparties(id),
  business_objective TEXT,
  annual_value NUMERIC,
  tier TEXT DEFAULT 'standard',
  stage TEXT DEFAULT 'draft',
  owner_id UUID,
  expected_close_date DATE,
  actual_close_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add workstream_type_id to templates table
ALTER TABLE public.templates ADD COLUMN workstream_type_id UUID REFERENCES public.workstream_types(id);

-- Enable RLS on new tables
ALTER TABLE public.workstream_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstreams ENABLE ROW LEVEL SECURITY;

-- RLS policies for workstream_types (all authenticated can view, law users can manage)
CREATE POLICY "Authenticated users can view workstream_types"
  ON public.workstream_types FOR SELECT USING (true);

CREATE POLICY "Law users can manage workstream_types"
  ON public.workstream_types FOR ALL
  USING (has_role(auth.uid(), 'general_counsel') OR has_role(auth.uid(), 'legal_ops') OR has_role(auth.uid(), 'contract_counsel'));

-- RLS policies for counterparties (all authenticated can view and manage)
CREATE POLICY "Authenticated users can view counterparties"
  ON public.counterparties FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage counterparties"
  ON public.counterparties FOR ALL USING (true);

-- RLS policies for approval_templates (all authenticated can view, law users can manage)
CREATE POLICY "Authenticated users can view approval_templates"
  ON public.approval_templates FOR SELECT USING (true);

CREATE POLICY "Law users can manage approval_templates"
  ON public.approval_templates FOR ALL
  USING (has_role(auth.uid(), 'general_counsel') OR has_role(auth.uid(), 'legal_ops') OR has_role(auth.uid(), 'contract_counsel'));

-- RLS policies for workstreams (all authenticated can view, sales can manage)
CREATE POLICY "Authenticated users can view workstreams"
  ON public.workstreams FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage workstreams"
  ON public.workstreams FOR ALL USING (true);

-- Seed workstream types
INSERT INTO public.workstream_types (name, description, required_documents, default_workflow) VALUES
  ('Enterprise SaaS Deal', 'Large enterprise software subscription deals with complex requirements', ARRAY['NDA', 'MSA', 'Pricing Schedule', 'SLA'], 'standard_enterprise'),
  ('Professional Services Deal', 'Consulting and professional services engagements', ARRAY['SOW', 'MSA', 'NDA'], 'professional_services'),
  ('Channel Partnership', 'Partner and reseller agreements', ARRAY['Partner Agreement', 'NDA', 'Revenue Share Schedule'], 'partnership');

-- Seed counterparties
INSERT INTO public.counterparties (name, entity_type, state_of_formation, relationship_status, counterparty_type, primary_contact_name, primary_contact_email, notes) VALUES
  ('Acme Corp', 'Delaware corporation', 'Delaware', 'customer', 'customer', 'Jane Wilson', 'jane.wilson@acme.com', 'Long-standing customer since 2021'),
  ('TechStart Inc', 'Delaware corporation', 'Delaware', 'prospect', 'customer', 'Mike Chen', 'mike.chen@techstart.io', 'Hot prospect, ready to close Q1'),
  ('Global Industries Ltd', 'English limited company', 'United Kingdom', 'customer', 'customer', 'Sarah Thompson', 'sthompson@globalind.co.uk', 'Enterprise customer, complex requirements'),
  ('Innovate Labs', 'California corporation', 'California', 'prospect', 'customer', 'Alex Rivera', 'alex@innovatelabs.com', 'Startup in evaluation phase'),
  ('Pacific Partners LLC', 'Delaware LLC', 'Delaware', 'customer', 'partner', 'David Park', 'dpark@pacificpartners.com', 'Channel partner in APAC region');

-- Seed approval templates
INSERT INTO public.approval_templates (name, description, approval_sequence, trigger_conditions, is_active) VALUES
  ('Standard Deal Approval', 'Default approval flow for standard deals', 
   '[{"gate": 1, "approver_role": "sales_manager", "description": "Sales Manager Review"}, {"gate": 2, "approver_role": "finance_reviewer", "description": "Finance Review"}, {"gate": 3, "approver_role": "contract_counsel", "description": "Legal Final Review"}]'::jsonb,
   '{"min_value": 0, "max_value": 100000}'::jsonb, true),
  ('Enterprise Deal Approval', 'Enhanced approval flow for enterprise deals over $100k',
   '[{"gate": 1, "approver_role": "sales_manager", "description": "Sales Manager Review"}, {"gate": 2, "approver_role": "finance_reviewer", "description": "Finance Review"}, {"gate": 3, "approver_role": "contract_counsel", "description": "Legal Review"}, {"gate": 4, "approver_role": "general_counsel", "description": "General Counsel Approval"}]'::jsonb,
   '{"min_value": 100000}'::jsonb, true),
  ('Fast Track Approval', 'Expedited approval for renewals and small deals',
   '[{"gate": 1, "approver_role": "sales_manager", "description": "Manager Quick Review"}]'::jsonb,
   '{"max_value": 25000, "deal_type": "renewal"}'::jsonb, true);

-- Seed clauses from uploaded documents
INSERT INTO public.clauses (title, category, text, risk_level, business_context, is_standard) VALUES
  -- NDA Clauses
  ('Maintaining Confidentiality', 'Confidentiality', 'During the disclosure period, perpetually thereafter with respect to any confidential information that constitutes a trade secret, and for three years thereafter with respect to all other confidential information, the parties shall not (1) disclose any confidential information except as permitted by this agreement or (2) use any confidential information for any reason other than to evaluate the proposed opportunity. After completing its evaluation, each party shall promptly return or destroy all confidential information in its possession.', 'medium', 'Core NDA obligation - protects proprietary information during business discussions', true),
  
  ('Disclosure Period', 'Confidentiality', 'The "disclosure period" terminates 3 years after the date of this agreement. Either party may terminate the disclosure period early by giving the other party written notice of termination. If either party decides not to pursue the proposed opportunity, that party shall promptly terminate the disclosure period.', 'low', 'Defines the timeframe for confidentiality obligations', true),
  
  ('Definition of Confidential Information', 'Definitions', 'In this agreement, "confidential information" means any proprietary information delivered by either party except for (1) information that becomes public after the disclosing party discloses it to the recipient, other than as a result of breach of this agreement by the recipient, or is already public when the disclosing party discloses it to the recipient, (2) information disclosed to the recipient or its representatives by a person who is not under an obligation to the disclosing party to keep that information confidential, or (3) information the recipient developed before its disclosure by the disclosing party without reference to the disclosing party''s confidential information.', 'low', 'Standard carve-outs for what constitutes confidential information', true),
  
  ('Disclosure Required by Law', 'Confidentiality', 'If any proceeding is brought to compel the recipient or any of its representatives to disclose any confidential information or if the recipient or any of its representatives are otherwise required by law to disclose any confidential information, the recipient shall: (1) unless by doing so it would violate a law or an order of a government body, promptly notify the disclosing party of that proceeding or that requirement; (2) at the disclosing party''s expense, cooperate with the disclosing party in any proceeding the disclosing party brings to prevent that disclosure or to protect the confidentiality of any information that is disclosed.', 'medium', 'Protects rights when legally compelled to disclose', true),
  
  ('Permitted Disclosure', 'Confidentiality', 'The recipient shall not disclose confidential information to any person except to its representatives who require that confidential information to evaluate the proposed opportunity. Before disclosing any confidential information to any such representative, the recipient shall inform the representative of the confidential nature of the confidential information and shall cause each representative to sign a written confidentiality agreement promising to keep that confidential information confidential.', 'medium', 'Limits who can receive confidential information', true),
  
  ('Precautions and Misappropriation', 'Confidentiality', 'Each party shall protect the security of the confidential information using precautions equal to those it takes to protect its own confidential information or those that would be taken by a reasonable person in its position, whichever are greater. If any employee or other person misappropriates confidential information from either party, that party will be liable to the other as if it had breached this agreement.', 'medium', 'Establishes standard of care for protecting confidential information', true),
  
  ('No Other Rights or Obligations', 'General', 'This agreement does not (1) grant the recipient any interest in the disclosing party''s intellectual property, (2) obligate either party to disclose any information, or (3) obligate the parties to negotiate or to pursue any opportunity.', 'low', 'Clarifies that NDA is limited in scope', true),
  
  -- MSA Clauses
  ('Platform Authorization', 'Services', 'During the service term, the Counterparty may use the software platform to manage its business operations in accordance with this agreement.', 'low', 'Core license grant for platform access', true),
  
  ('Training Obligations', 'Services', 'TestCo shall provide the Counterparty initial and ongoing training as reasonably needed and the Counterparty shall ensure that its representatives are appropriately trained in the administration of the services.', 'low', 'Ensures customers are properly trained on the platform', true),
  
  ('Platform Improvements', 'Services', 'TestCo may release new services and service improvements at any time. TestCo shall provide appropriate notice and documentation for any new service or improvement. TestCo shall not materially reduce the function of any service without providing at least one year''s notice and shall provide updated documentation in connection with any service changes.', 'medium', 'Protects customers from unexpected service degradation', true),
  
  ('Pricing Terms', 'Commercial', 'The parties will determine service fees in SOWs or other pricing schedules referencing this MSA. If those pricing schedules do not define services invoiced to the Counterparty, TestCo may invoice that service at its standard list price.', 'low', 'Establishes pricing structure for services', true),
  
  ('Billing Terms', 'Commercial', 'TestCo shall invoice the Counterparty monthly. Each invoice will state the fees due for all services provisioned in the platform on the relevant date plus any applicable taxes.', 'low', 'Standard monthly billing arrangement', true),
  
  ('Payment Terms', 'Commercial', 'The Counterparty shall pay all invoices via ACH or wire transfer no later than 25 days after the invoice date. Invoiced amounts unpaid by the due date will accrue interest at 1.5% per month.', 'medium', 'Net-25 payment terms with interest on late payments', true),
  
  ('Late Payment Deposit', 'Commercial', 'If the Counterparty is late paying two invoices in any six-month period, TestCo may require the Counterparty to maintain a deposit equal to the charges invoiced in the previous two months.', 'medium', 'Protection against chronically late payers', true),
  
  ('Invoice Disputes', 'Commercial', 'To dispute an unpaid invoice, the Counterparty must, no later than the due date of the invoice, email notice of the dispute to billing@TestCo.com and pay all undisputed portions of the invoice. To dispute a paid invoice, the Counterparty must email notice to billing@TestCo.com no later than 90 days after the date of the invoice.', 'low', 'Establishes process for invoice disputes', true),
  
  ('Suspension for Cause', 'Services', 'If the Counterparty fails to pay any undisputed amount within 10 days after the due date, or if it commits any other material breach of this agreement, TestCo may immediately suspend all services after providing five business days'' advance notice.', 'high', 'Right to suspend services for non-payment or breach', true),
  
  ('Fair Use Policy', 'Services', 'TestCo may suspend any services to prevent or to mitigate: (1) any security breach; (2) any fraudulent or illegal activity; (3) any activity that compromises or threatens to harm TestCo''s ability to provide the services; or (4) any abuse or other use of the TestCo systems that is inconsistent with industry norms or the provisions of this agreement.', 'medium', 'Protection against misuse of platform', true),
  
  ('Non-Renewal', 'Term', 'Either party may elect not to renew the service term by providing written notice to the other party no less than 90 days before the end of the service term. Non-renewal will become effective at the end of the service term.', 'low', 'Standard 90-day non-renewal notice period', true),
  
  ('Termination for Cause', 'Term', 'Neither party may terminate the service term without cause. Either party may immediately terminate the service term if the other party has materially breached this agreement and the breach remains uncured 30 days after written notice of the breach was delivered.', 'medium', 'Standard termination for material breach provision', true),
  
  ('Confidential Information', 'Confidentiality', 'Each party may receive confidential information from the other. Except as permitted under section 10.2, the recipient shall not: (1) use confidential information belonging to the disclosing party except to comply with the recipient''s obligations or to exercise its rights under this agreement; or (2) disclose the confidential information to any person except to the recipient''s affiliates and contractors who are bound by confidentiality obligations at least as restrictive as those in this section.', 'medium', 'Mutual confidentiality obligations for contract parties', true),
  
  ('Compliance with Laws', 'General', 'Each party shall comply with all applicable laws in performing its obligations under this agreement.', 'low', 'Standard legal compliance requirement', true),
  
  ('Proprietary Rights', 'Intellectual Property', 'Except for the right to access and use the TestCo platform and the accompanying documentation, TestCo does not grant the Counterparty any interest in (1) the TestCo platform, (2) any documentation related to the TestCo platform, or (3) any other intellectual property belonging to TestCo.', 'medium', 'Protects company''s IP rights in the platform', true),
  
  ('License Restrictions', 'Intellectual Property', 'The Counterparty shall not: (1) reverse engineer any element of the TestCo platform; (2) modify, copy, or create derivative works of any service within the TestCo platform; (3) attempt to obtain a copy of any element of the services; or (4) allow any third party to sub-license, transfer, distribute, sell, or resell any services provided by TestCo under this agreement.', 'high', 'Critical restrictions on customer use of platform', true),
  
  ('Warranty Disclaimer', 'Liability', 'Except as stated in the SLA, TestCo provides the TestCo platform on an "as is" basis. TestCo does not warrant that the TestCo platform will be free of errors or disruptions or that the Counterparty will achieve any business results by its use of the services. To the extent permitted by law, TestCo hereby disclaims all implied warranties of merchantability, fitness for a particular purpose, non-infringement of intellectual property rights, and all other warranties.', 'high', 'Standard warranty disclaimer limiting liability', true),
  
  ('Limit of Liability', 'Liability', 'Except for either party''s indemnity obligations, damages arising from either party''s breach of its confidentiality obligations, the Counterparty''s breach of its license restrictions, or the Counterparty''s breach of its payment obligations, each party''s aggregate liability arising from this agreement will not exceed the service fees billable to the Counterparty for the three months before the events giving rise to the claim.', 'high', 'Caps liability at 3 months of fees with carve-outs', true),
  
  ('Indemnification by Provider', 'Liability', 'TestCo shall indemnify the Counterparty against any claim arising from an allegation that any part of the TestCo platform infringes the intellectual property rights of any third party. TestCo will have no obligations under this section if the alleged infringement results from the Counterparty''s unauthorized use or modification of the TestCo platform.', 'high', 'IP indemnification for customers', true),
  
  ('Force Majeure', 'General', 'If either party is unable to comply with any of its obligations because of a force majeure event, that inability to comply will not constitute breach if: (1) that party uses reasonable efforts to perform those obligations; (2) that party''s inability to comply is not due to its failure to take reasonable measures to avoid such a force majeure event; and (3) that party promptly gives notice of the force majeure event and its inability to comply with its obligations.', 'low', 'Standard force majeure protection', true),
  
  ('Entire Agreement', 'General', 'This agreement supersedes all prior or contemporaneous agreements and understandings regarding its subject matter.', 'low', 'Standard integration clause', true),
  
  ('Waiver', 'General', 'No failure or delay by either party in exercising its rights under this agreement will constitute a waiver of those rights. Any waiver of any provision of this agreement must be in writing and signed by an officer of the waiving party.', 'low', 'Protects against implied waivers', true),
  
  -- Consulting Agreement Clauses
  ('Independent Contractor Status', 'Services', 'The Consultant is an independent contractor. Nothing in this agreement will be construed to create an employment relationship, principal and agent relationship, partnership, or joint venture.', 'medium', 'Establishes contractor relationship to avoid employment issues', true),
  
  ('No Authority to Bind', 'Services', 'The Consultant has no authority to bind TestCo to any agreement. The Consultant shall not represent himself to have any authority he does not have and shall not hold himself out as a representative of TestCo.', 'medium', 'Prevents consultants from making unauthorized commitments', true),
  
  ('Consultant Responsibilities', 'Services', 'The Consultant states that he has the necessary skills, experience, facilities, and equipment to effectively perform his obligations under this agreement.', 'low', 'Consultant affirms capability to perform', true),
  
  ('Intellectual Property Assignment', 'Intellectual Property', 'The Consultant shall promptly and fully disclose to TestCo any intellectual property he conceives or develops during the term of this agreement when working on TestCo'' behalf. The Consultant hereby assigns to TestCo or its designee all of the Consultant''s interest in any such intellectual property.', 'high', 'Critical clause ensuring company owns all work product', true),
  
  ('Work Made for Hire', 'Intellectual Property', 'The Consultant acknowledges that all original works of authorship which are protectable by copyright and which were created within the scope of this consultancy when working on TestCo'' behalf are "works made for hire" as that term is defined in the United States Copyright Act.', 'high', 'Ensures copyright ownership of all deliverables', true),
  
  ('No Conflicting Obligations', 'General', 'The Consultant states that performance of the terms of this agreement will not breach any existing agreement with any other person. The Consultant shall not enter into any agreement in conflict with this agreement.', 'medium', 'Ensures consultant can perform without conflicts', true),
  
  ('Severability', 'General', 'The parties intend as follows: (1) that if any provision of this agreement is held to be unenforceable by a competent authority, then that provision will be modified to the minimum extent necessary to make it enforceable, unless that modification is not permitted by law, in which case that provision will be disregarded; (2) that if an unenforceable provision is modified or disregarded, then the rest of the agreement will remain in effect as written.', 'low', 'Protects agreement if any provision is struck down', true),
  
  -- Additional commercial and operational clauses
  ('Service Term', 'Term', 'The service term begins on the date the Counterparty signs this pricing schedule and continues for the initial period stated. Unless either party provides written notice of termination at least six months before the end of the service term, the service term will automatically extend for successive renewal periods.', 'medium', 'Auto-renewal with 6-month opt-out window', true),
  
  ('Monthly Minimum Commitment', 'Commercial', 'In addition to the service fees invoiced, TestCo shall invoice the Counterparty for any shortfall between the invoiced service fees and the monthly minimum commitments stated in the pricing schedule.', 'medium', 'Ensures minimum revenue commitment from customer', true),
  
  ('Professional Services Fees', 'Commercial', 'Professional services including platform setup, custom projects, and implementation services are billed as one-time non-recurring charges (NRC) as detailed in the pricing schedule.', 'low', 'Defines professional services pricing structure', true),
  
  ('Governing Law', 'General', 'This agreement is governed by the laws of the State of Delaware.', 'low', 'Standard choice of law provision', true),
  
  ('Effectiveness and Date', 'General', 'This agreement will become effective when both parties have signed it. The date of this agreement is the date it is signed by the last party to sign it.', 'low', 'Standard signature and effective date clause', true),
  
  ('Notice Requirements', 'General', 'All notices under this agreement must be in writing and must be delivered by hand, by email, or by post or courier with proof of delivery. Notice will be deemed to have been duly given upon delivery if delivered by hand, upon acknowledgement of receipt if sent by email, or on the day tracking information indicates delivery if delivered by post or courier.', 'low', 'Establishes formal notice procedures', true);

-- Now seed templates with workstream type associations
-- First, get the workstream type IDs
DO $$
DECLARE
  enterprise_type_id UUID;
  professional_type_id UUID;
BEGIN
  SELECT id INTO enterprise_type_id FROM public.workstream_types WHERE name = 'Enterprise SaaS Deal' LIMIT 1;
  SELECT id INTO professional_type_id FROM public.workstream_types WHERE name = 'Professional Services Deal' LIMIT 1;
  
  -- Insert templates
  INSERT INTO public.templates (name, category, version, status, content, workstream_type_id) VALUES
    ('Standard NDA', 'NDA', 'v25.12', 'Active', 'This non-disclosure agreement is between TestCo, Inc., a Utah corporation ("TestCo"), and COUNTERPARTY NAME. The parties are evaluating a proposed opportunity and want to share confidential information.', NULL),
    ('Software Development Consulting Agreement', 'Consulting', 'v1.0', 'Active', 'This consulting agreement is between TestCo, Inc., a Utah company and the Consultant. The parties agree to the following terms for software development services.', professional_type_id),
    ('Single-Column Contract Template', 'Template', 'v1.0', 'Active', 'This single-column contract template provides a clean, readable format for standard business agreements.', NULL),
    ('Dual-Column Contract Template', 'Template', 'v1.0', 'Active', 'This dual-column master services agreement template provides a professional format for enterprise contracts.', enterprise_type_id),
    ('Pricing Schedule', 'Commercial', 'v24.10', 'Active', 'Standard pricing schedule template for documenting service fees, minimum commitments, and billing terms.', enterprise_type_id),
    ('Client Service Proposal', 'Proposal', 'v1.0', 'Active', 'Professional service proposal template for legal and consulting engagements.', professional_type_id),
    ('Master Subscription Agreement', 'MSA', 'v24.12', 'Active', 'This master subscription agreement is between TestCo, Inc., a Utah company, and the Counterparty for use of the TestCo software platform.', enterprise_type_id),
    ('Enterprise SaaS Agreement', 'MSA', 'v24.12', 'Active', 'Comprehensive enterprise software agreement with enhanced terms for large customers.', enterprise_type_id),
    ('Professional Services SOW', 'SOW', 'v1.0', 'Active', 'Statement of work template for professional services engagements.', professional_type_id);
END $$;

-- Seed workstreams at different stages
DO $$
DECLARE
  acme_id UUID;
  techstart_id UUID;
  global_id UUID;
  innovate_id UUID;
  pacific_id UUID;
  enterprise_type_id UUID;
  professional_type_id UUID;
  msa_template_id UUID;
  nda_template_id UUID;
  consulting_template_id UUID;
BEGIN
  -- Get counterparty IDs
  SELECT id INTO acme_id FROM public.counterparties WHERE name = 'Acme Corp' LIMIT 1;
  SELECT id INTO techstart_id FROM public.counterparties WHERE name = 'TechStart Inc' LIMIT 1;
  SELECT id INTO global_id FROM public.counterparties WHERE name = 'Global Industries Ltd' LIMIT 1;
  SELECT id INTO innovate_id FROM public.counterparties WHERE name = 'Innovate Labs' LIMIT 1;
  SELECT id INTO pacific_id FROM public.counterparties WHERE name = 'Pacific Partners LLC' LIMIT 1;
  
  -- Get workstream type IDs
  SELECT id INTO enterprise_type_id FROM public.workstream_types WHERE name = 'Enterprise SaaS Deal' LIMIT 1;
  SELECT id INTO professional_type_id FROM public.workstream_types WHERE name = 'Professional Services Deal' LIMIT 1;
  
  -- Get template IDs
  SELECT id INTO msa_template_id FROM public.templates WHERE name = 'Master Subscription Agreement' LIMIT 1;
  SELECT id INTO nda_template_id FROM public.templates WHERE name = 'Standard NDA' LIMIT 1;
  SELECT id INTO consulting_template_id FROM public.templates WHERE name = 'Software Development Consulting Agreement' LIMIT 1;
  
  -- Insert workstreams at different stages
  INSERT INTO public.workstreams (name, workstream_type_id, template_id, counterparty_id, business_objective, annual_value, tier, stage, expected_close_date, notes) VALUES
    ('Acme Corp Platform Renewal 2025', enterprise_type_id, msa_template_id, acme_id, 'Renew and expand platform subscription with additional user licenses', 450000, 'enterprise', 'negotiation', '2025-02-28', 'Customer requesting 10% discount for 3-year commitment'),
    ('TechStart Enterprise Deployment', enterprise_type_id, msa_template_id, techstart_id, 'New enterprise customer deployment with full platform access', 275000, 'enterprise', 'approval', '2025-01-31', 'Fast-tracking for Q1 close. Legal review in progress.'),
    ('Global Industries Integration Project', professional_type_id, consulting_template_id, global_id, 'Custom integration with existing ERP systems', 180000, 'standard', 'signature', '2025-01-15', 'Final signatures pending from UK legal team'),
    ('Innovate Labs Pilot Program', enterprise_type_id, msa_template_id, innovate_id, 'Pilot program with option to expand to full enterprise license', 75000, 'standard', 'draft', '2025-03-31', 'Building business case for internal approval'),
    ('Pacific Partners Channel Agreement', enterprise_type_id, nda_template_id, pacific_id, 'Establish channel partnership for APAC distribution', 120000, 'standard', 'negotiation', '2025-02-15', 'Negotiating revenue share terms'),
    ('Acme Corp Consulting Services', professional_type_id, consulting_template_id, acme_id, 'Additional consulting services for platform optimization', 95000, 'standard', 'closed_won', '2024-12-01', 'Completed - services in progress');
END $$;

-- Add some clause alternatives
INSERT INTO public.clause_alternatives (clause_id, alternative_text, use_case, business_impact)
SELECT c.id, 
  'The Counterparty shall pay all invoices via ACH, wire transfer, or credit card no later than 30 days after the invoice date. Invoiced amounts unpaid by the due date will accrue interest at 1.0% per month.',
  'Customer requesting Net-30 and reduced interest',
  'Extends payment window by 5 days, reduces late payment revenue by 0.5%'
FROM public.clauses c WHERE c.title = 'Payment Terms' LIMIT 1;

INSERT INTO public.clause_alternatives (clause_id, alternative_text, use_case, business_impact)
SELECT c.id,
  'The Counterparty shall pay all invoices via ACH or wire transfer no later than 45 days after the invoice date. Invoiced amounts unpaid by the due date will accrue interest at 1.5% per month.',
  'Enterprise customer with longer payment cycles',
  'Extends payment window by 20 days - requires finance approval for deals over $200k'
FROM public.clauses c WHERE c.title = 'Payment Terms' LIMIT 1;

INSERT INTO public.clause_alternatives (clause_id, alternative_text, use_case, business_impact)
SELECT c.id,
  'Either party may elect not to renew the service term by providing written notice to the other party no less than 60 days before the end of the service term.',
  'Customer requesting shorter notice period',
  'Reduces notice period by 30 days - acceptable for standard tier customers'
FROM public.clauses c WHERE c.title = 'Non-Renewal' LIMIT 1;

INSERT INTO public.clause_alternatives (clause_id, alternative_text, use_case, business_impact)
SELECT c.id,
  'Each party''s aggregate liability arising from this agreement will not exceed the service fees billable to the Counterparty for the twelve months before the events giving rise to the claim.',
  'Enterprise customer requesting higher liability cap',
  'Increases liability cap from 3 months to 12 months - requires legal approval'
FROM public.clauses c WHERE c.title = 'Limit of Liability' LIMIT 1;

INSERT INTO public.clause_alternatives (clause_id, alternative_text, use_case, business_impact)
SELECT c.id,
  'The "disclosure period" terminates 5 years after the date of this agreement. Either party may terminate the disclosure period early by giving the other party written notice of termination.',
  'Extended confidentiality for sensitive negotiations',
  'Extends confidentiality period by 2 years - standard for enterprise deals'
FROM public.clauses c WHERE c.title = 'Disclosure Period' LIMIT 1;
