export type CounterpartyTier = 'enterprise' | 'mid_market' | 'smb';

export type PaymentTerm = 'net_30' | 'net_60' | 'net_90' | 'net_120';

export const TIER_LABELS: Record<CounterpartyTier, string> = {
  enterprise: 'Enterprise',
  mid_market: 'Mid-Market',
  smb: 'SMB',
};

export const PAYMENT_TERM_LABELS: Record<PaymentTerm, string> = {
  net_30: 'Net 30',
  net_60: 'Net 60',
  net_90: 'Net 90',
  net_120: 'Net 120',
};

export interface DynamicThreshold {
  metric: 'contract_value' | 'annual_value' | 'duration_years';
  operator: 'less_than' | 'greater_than' | 'between';
  value: number;
  value_max?: number; // Used when operator is 'between'
  adjustment: number; // Percentage adjustment to the base threshold
}

export interface TierStandards {
  payment_terms: PaymentTerm[];
  discount_max: number;          // 0-100 percentage
  liability_cap_min: number;     // minimum $ amount
  contract_duration_min: number; // years
  contract_duration_max: number; // years
  dynamic_thresholds?: DynamicThreshold[]; // Optional dynamic adjustments
}

export type DeviationType = 
  | 'payment_terms' 
  | 'liability_cap' 
  | 'discount' 
  | 'contract_duration';

export const DEVIATION_LABELS: Record<DeviationType, string> = {
  payment_terms: 'Payment Terms',
  liability_cap: 'Liability Cap',
  discount: 'Discount',
  contract_duration: 'Contract Duration',
};

export interface DeviationRoute {
  approver_role: string; // Now stores role UUID from custom_roles
}

export interface AutoApprovalConfig {
  auto_approval_standards: Partial<Record<CounterpartyTier, TierStandards>>;
  deviation_routing: Partial<Record<DeviationType, DeviationRoute>>;
}

export const DEFAULT_TIER_STANDARDS: TierStandards = {
  payment_terms: ['net_30'],
  discount_max: 10,
  liability_cap_min: 500000,
  contract_duration_min: 1,
  contract_duration_max: 3,
  dynamic_thresholds: [],
};

/**
 * @deprecated Use RoleCombobox component instead which fetches roles dynamically from custom_roles table
 */
export const APPROVER_ROLE_OPTIONS = [
  { value: 'finance', label: 'Finance' },
  { value: 'commercial_counsel', label: 'Commercial Counsel' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'general_counsel', label: 'General Counsel' },
  { value: 'legal_ops', label: 'Legal Ops' },
];

export const DYNAMIC_METRIC_OPTIONS = [
  { value: 'contract_value', label: 'Contract Value' },
  { value: 'annual_value', label: 'Annual Value' },
  { value: 'duration_years', label: 'Contract Duration' },
];

export const DYNAMIC_OPERATOR_OPTIONS = [
  { value: 'less_than', label: 'Less than' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'between', label: 'Between' },
];

// Custom Standards for extensible auto-approval criteria
export interface CustomStandard {
  id: string;
  name: string;
  operator: 'less_than' | 'greater_than' | 'equals' | 'between';
  value: number;
  value_max?: number;
}

export const CUSTOM_STANDARD_OPERATOR_OPTIONS = [
  { value: 'less_than', label: 'Less than' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'equals', label: 'Equals' },
  { value: 'between', label: 'Between' },
];
