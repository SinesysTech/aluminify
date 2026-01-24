import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import ModoFocoClient from './modo-foco-client';

export const metadata: Metadata = {
  title: 'Modo Foco'
};

export default async function ModoFocoPage() {
  await requireUser();

  return <ModoFocoClient />;
}

