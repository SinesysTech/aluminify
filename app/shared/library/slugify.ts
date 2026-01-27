/**
 * Gera um slug URL-safe a partir de um texto.
 *
 * - Converte para minúsculas
 * - Remove acentos (NFD + remoção de diacríticos)
 * - Converte espaços em hífens
 * - Remove caracteres não alfanuméricos (mantém hífen)
 * - Colapsa hífens duplicados
 */
export function slugify(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacríticos
    .replace(/\s+/g, "-") // espaços -> hífens
    .replace(/[^a-z0-9-]/g, "") // remove caracteres especiais
    .replace(/-+/g, "-") // colapsa hífens duplicados
    .replace(/^-|-$/g, ""); // remove hífens no início/fim
}

