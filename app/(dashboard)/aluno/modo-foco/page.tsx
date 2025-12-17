import { requireUser } from '@/lib/auth';
import ModoFocoClient from './modo-foco-client';

export default async function ModoFocoPage() {
  await requireUser();

  return <ModoFocoClient />;
}

