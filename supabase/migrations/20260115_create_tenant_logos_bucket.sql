-- Migration: Create tenant-logos storage bucket
-- Description: Creates the storage bucket for tenant logo uploads with proper RLS policies
-- Author: Brand Customization System
-- Date: 2026-01-15

-- 1. Create the storage bucket for tenant logos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'tenant-logos',
    'tenant-logos',
    true, -- public bucket so logos can be displayed without auth
    5242880, -- 5MB max file size
    array['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon', 'image/webp']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon', 'image/webp'];

-- 2. Create RLS policies for the bucket

-- Allow anyone to view logos (public bucket)
create policy "Public can view tenant logos"
    on storage.objects
    for select
    to public
    using (bucket_id = 'tenant-logos');

-- Allow authenticated users who are empresa admins to upload logos
create policy "Empresa admins can upload tenant logos"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'tenant-logos'
        and (
            -- Empresa admins can upload logos for their empresa
            -- The file path should start with the empresa_id
            exists (
                select 1 from public.professores p
                where p.id = auth.uid()
                and p.is_admin = true
                and (storage.foldername(name))[1] = p.empresa_id::text
            )
        )
    );

-- Allow authenticated users who are empresa admins to update their logos
create policy "Empresa admins can update tenant logos"
    on storage.objects
    for update
    to authenticated
    using (
        bucket_id = 'tenant-logos'
        and (
            exists (
                select 1 from public.professores p
                where p.id = auth.uid()
                and p.is_admin = true
                and (storage.foldername(name))[1] = p.empresa_id::text
            )
        )
    )
    with check (
        bucket_id = 'tenant-logos'
        and (
            exists (
                select 1 from public.professores p
                where p.id = auth.uid()
                and p.is_admin = true
                and (storage.foldername(name))[1] = p.empresa_id::text
            )
        )
    );

-- Allow authenticated users who are empresa admins to delete their logos
create policy "Empresa admins can delete tenant logos"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'tenant-logos'
        and (
            exists (
                select 1 from public.professores p
                where p.id = auth.uid()
                and p.is_admin = true
                and (storage.foldername(name))[1] = p.empresa_id::text
            )
        )
    );

-- Add comment
comment on column storage.buckets.id is 'tenant-logos bucket stores logo files for empresa branding customization';
