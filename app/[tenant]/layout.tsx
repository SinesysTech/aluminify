import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { TenantContextProvider } from './tenant-context';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant: tenantSlug } = await params;

  // Validate that tenant exists
  const supabase = await createClient();

  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('id, nome, slug')
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
