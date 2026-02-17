-- Allow deleting a workstream_type even when templates reference it.
-- Templates survive with workstream_type_id set to NULL.

ALTER TABLE public.templates
  DROP CONSTRAINT templates_workstream_type_id_fkey,
  ADD CONSTRAINT templates_workstream_type_id_fkey
    FOREIGN KEY (workstream_type_id)
    REFERENCES public.workstream_types(id)
    ON DELETE SET NULL;

-- Force PostgREST to pick up the recreated FK so embedded queries still work.
NOTIFY pgrst, 'reload schema';
