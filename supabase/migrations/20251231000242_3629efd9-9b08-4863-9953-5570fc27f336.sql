-- Seed needs from existing pending workstream_approvals
INSERT INTO needs (
  workstream_id,
  need_type,
  description,
  satisfier_role,
  status,
  source_type,
  source_id,
  source_reason
)
SELECT 
  wa.workstream_id,
  'approval',
  COALESCE(
    (at.approval_sequence->>(wa.current_gate - 1)::text)::jsonb->>'label',
    'Approval required at gate ' || wa.current_gate
  ),
  COALESCE(
    (at.approval_sequence->>(wa.current_gate - 1)::text)::jsonb->>'role',
    'general_counsel'
  ),
  'open',
  'approval',
  wa.id,
  'Seeded from existing pending approval'
FROM workstream_approvals wa
JOIN approval_templates at ON wa.approval_template_id = at.id
WHERE wa.status = 'pending'
  AND wa.workstream_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM needs n 
    WHERE n.source_id = wa.id 
    AND n.source_type = 'approval'
  );