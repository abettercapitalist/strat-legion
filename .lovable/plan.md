

## Deploy `generate-document` Edge Function

### Changes Required

**1. Add function entry to `supabase/config.toml`**

Add a `[functions.generate-document]` section with `verify_jwt = false` (auth will be handled in code or it's called server-side).

**2. Create Storage Bucket**

The function uploads DOCX files to a `workstream-documents` storage bucket, but no storage buckets exist yet. A migration is needed to create this bucket.

**3. Deploy**

The function will be auto-deployed with the config change. Manual deployment can also be triggered.

### Notes

- The `LOVABLE_API_KEY` secret is already configured, which the function requires for AI template merging.
- The function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, both available by default in edge functions.
- The existing build errors (TypeScript issues in hooks, esm.sh 500 in check-tagging-prompt) are pre-existing and unrelated to this deployment.

### Technical Details

Config addition:
```toml
[functions.generate-document]
verify_jwt = false
```

Storage bucket migration:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('workstream-documents', 'workstream-documents', false);
```

