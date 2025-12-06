import { requireUser } from '@/lib/auth';
import ModoFocoClient from './modo-foco-client';

type SearchParams = {
  cursoId?: string;
  disciplinaId?: string;
  frenteId?: string;
  atividadeId?: string;
};

export default async function ModoFocoPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();

  return <ModoFocoClient searchParams={searchParams} />;
}
