-- Add business_domain column for industry vertical categorization.
ALTER TABLE public.counterparties
  ADD COLUMN IF NOT EXISTS business_domain TEXT;

-- Backfill existing counterparties.
UPDATE public.counterparties SET business_domain = 'enterprise_saas'     WHERE name = 'Acme Corp';
UPDATE public.counterparties SET business_domain = 'legal_tech'          WHERE name = 'TechStart Inc';
UPDATE public.counterparties SET business_domain = 'financial_services'  WHERE name = 'Global Industries Ltd';
UPDATE public.counterparties SET business_domain = 'healthcare'          WHERE name = 'Innovate Labs';
UPDATE public.counterparties SET business_domain = 'enterprise_saas'     WHERE name = 'Pacific Partners LLC';

-- Add new counterparties with business domains.
INSERT INTO public.counterparties (name, entity_type, relationship_status, counterparty_type, primary_contact_name, primary_contact_email, business_domain)
VALUES
  ('Meridian Health Systems', 'Delaware corporation', 'customer', 'customer', 'Dr. Amy Lin', 'alin@meridianhealth.com', 'healthcare'),
  ('Atlas Financial Group', 'New York corporation', 'customer', 'customer', 'James Ortiz', 'jortiz@atlasfinancial.com', 'financial_services')
ON CONFLICT DO NOTHING;
