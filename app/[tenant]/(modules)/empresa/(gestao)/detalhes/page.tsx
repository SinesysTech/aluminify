import type { Metadata } from 'next'
import EmpresaClientPage from './empresa-client';

export const metadata: Metadata = {
  title: 'Minha Empresa'
}

export default function EmpresaPage() {
  return <EmpresaClientPage />;
}

