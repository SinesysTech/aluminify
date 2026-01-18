-- Drop the obsolete version of the function (3 arguments) which causes ambiguity
DROP FUNCTION IF EXISTS public.importar_cronograma_aulas(text, text, jsonb);

-- Grant execute permissions to the correct version (4 arguments)
GRANT EXECUTE ON FUNCTION public.importar_cronograma_aulas(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.importar_cronograma_aulas(uuid, text, text, jsonb) TO service_role;
