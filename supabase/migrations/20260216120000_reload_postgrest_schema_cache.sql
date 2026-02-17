-- Reload PostgREST schema cache after FK constraint changes in previous migration.
NOTIFY pgrst, 'reload schema';
