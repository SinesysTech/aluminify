ALTER TABLE public.sessoes_estudo
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Reutiliza a função handle_updated_at já existente no projeto
DROP TRIGGER IF EXISTS handle_updated_at_sessoes_estudo ON public.sessoes_estudo;
CREATE TRIGGER handle_updated_at_sessoes_estudo
BEFORE UPDATE ON public.sessoes_estudo
FOR EACH ROW
EXECUTE PROCEDURE handle_updated_at();













