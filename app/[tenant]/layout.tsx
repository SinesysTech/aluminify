import { notFound } from 'next/navigation';
import { getDatabaseClient } from '@/app/shared/core/database/database';
import { TenantContextProvider } from './tenant-context';
import { headers } from 'next/headers';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant } = await params;
  const tenantSlug = (tenant || '').toLowerCase();

  // 1. Try to get tenant info from headers (injected by middleware)
  const headersList = await headers();
  const headerTenantId = headersList.get('x-tenant-id');
  const headerTenantSlug = headersList.get('x-tenant-slug');
  const headerTenantName = headersList.get('x-tenant-name')
    ? decodeURIComponent(headersList.get('x-tenant-name')!)
    : null;

  // Verify if the header slug matches the URL tenant param to ensure consistency
  // (e.g. if someone manually navigates to a different slug but keeps old headers?? unlikely but safe)
  const isHeaderValid = headerTenantId && headerTenantSlug && headerTenantSlug === tenantSlug;

  if (isHeaderValid) {
    return (
      <TenantContextProvider
        empresaId={headerTenantId}
        empresaSlug={headerTenantSlug}
        empresaNome={headerTenantName || ''} // Fallback to empty string if name missing, though unlikely
      >
        {children}
      </TenantContextProvider>
    );
  }

  // 2. Fallback: Query Database if headers are missing or mismatched
  // Validate that tenant exists
  // Use admin client to bypass RLS - checking if tenant exists is not sensitive
  // and RLS on empresas table doesn't include alunos (only usuarios)
  const adminClient = getDatabaseClient();

  const { data: empresa, error } = await adminClient
    .from('empresas')
    .select('id, nome, slug')
    // also allow subdomain matching (same logic as middleware)
    .or(`slug.eq.${tenantSlug},subdomain.eq.${tenantSlug}`)
    .eq('ativo', true)
    .maybeSingle();

  if (error || !empresa) {
    console.error('[TenantLayout] Tenant not found:', tenantSlug, error?.message);
    notFound();
  }

  return (
    <TenantContextProvider
      empresaId={empresa.id}
      empresaSlug={empresa.slug}
      empresaNome={empresa.nome}
    >
      {children}
    </TenantContextProvider>
  );
}
