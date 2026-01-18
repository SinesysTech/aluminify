import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/server';

interface TenantSignUpPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function TenantSignUpPage({ params }: TenantSignUpPageProps) {
  const { tenant: tenantSlug } = await params;

  // Get tenant data
  const supabase = await createClient();

  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('id, nome, slug')
    .eq('slug', tenantSlug)
    .eq('ativo', true)
    .maybeSingle();

  if (error || !empresa) {
    console.error('[TenantSignUpPage] Tenant not found:', tenantSlug, error?.message);
    notFound();
  }

  // For now, redirect to the main sign-up page
  // TODO: Implement tenant-specific sign-up if needed
  return (
    <Suspense fallback={null}>
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Cadastro para {empresa.nome} em desenvolvimento.
        </p>
      </div>
    </Suspense>
  );
}
