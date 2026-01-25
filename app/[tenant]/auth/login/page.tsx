import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/app/shared/core/server';
import { TenantLoginPageClient } from '../components/tenant-login-page-client';

interface TenantLoginPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function TenantLoginPage({ params }: TenantLoginPageProps) {
  const { tenant: tenantSlug } = await params;

  // Get tenant data for branding
  const supabase = await createClient();

  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('id, nome, slug, logo_url')
    .eq('slug', tenantSlug)
    .eq('ativo', true)
    .maybeSingle();

  if (error || !empresa) {
    console.error('[TenantLoginPage] Tenant not found:', tenantSlug, error?.message);
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <TenantLoginPageClient
        tenantSlug={empresa.slug}
        empresaId={empresa.id}
        empresaNome={empresa.nome}
        logoUrl={empresa.logo_url}
      />
    </Suspense>
  );
}
