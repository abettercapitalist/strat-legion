-- Documents metadata table
create table public.workstream_documents (
  id uuid primary key default gen_random_uuid(),
  workstream_id uuid not null references public.workstreams(id) on delete cascade,
  step_id uuid references public.workstream_steps(id),
  template_id uuid references public.templates(id),
  document_type text not null,
  title text not null,
  storage_path text,
  file_format text default 'docx',
  status text not null default 'generating',
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workstream_documents enable row level security;

create policy "Users can view documents for their workstreams"
  on public.workstream_documents for select
  using (workstream_id in (
    select id from public.workstreams where owner_id = auth.uid()
  ));

-- Storage bucket for generated documents
insert into storage.buckets (id, name, public)
  values ('workstream-documents', 'workstream-documents', false);

create policy "Users can read their workstream documents"
  on storage.objects for select
  using (
    bucket_id = 'workstream-documents'
    and (storage.foldername(name))[1] in (
      select id::text from public.workstreams where owner_id = auth.uid()
    )
  );

create policy "Service role can insert documents"
  on storage.objects for insert
  with check (bucket_id = 'workstream-documents');
