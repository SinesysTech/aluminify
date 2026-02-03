import sys

file_path = "app/[tenant]/(modules)/dashboard/services/dashboard-analytics.service.ts"

with open(file_path, "r") as f:
    content = f.read()

search_text = """    // 4) Atividades desses módulos
    const atividades: Array<{ id: string; modulo_id: string }> = [];
    for (const idsChunk of chunk(moduloIds, 900)) {
      let q = client
        .from("atividades")
        .select("id, modulo_id")
        .in("modulo_id", idsChunk);
      if (opts.empresaId) q = q.eq("empresa_id", opts.empresaId);
      const { data: chunkRows, error: chunkErr } = await q;
      if (chunkErr) {
        console.error(
          "[dashboard-analytics] Erro ao buscar atividades por modulo_id:",
          chunkErr,
        );
        continue;
      }
      atividades.push(
        ...(((chunkRows ?? []) as Array<{ id: string; modulo_id: string }>) ??
          []),
      );
    }"""

replace_text = """    // 4) Atividades desses módulos
    const atividadesPromises = chunk(moduloIds, 900).map(async (idsChunk) => {
      let q = client
        .from("atividades")
        .select("id, modulo_id")
        .in("modulo_id", idsChunk);
      if (opts.empresaId) q = q.eq("empresa_id", opts.empresaId);
      const { data: chunkRows, error: chunkErr } = await q;
      if (chunkErr) {
        console.error(
          "[dashboard-analytics] Erro ao buscar atividades por modulo_id:",
          chunkErr,
        );
        return [];
      }
      return (chunkRows ?? []) as Array<{ id: string; modulo_id: string }>;
    });

    const atividades = (await Promise.all(atividadesPromises)).flat();"""

if search_text in content:
    new_content = content.replace(search_text, replace_text)
    with open(file_path, "w") as f:
        f.write(new_content)
    print("Successfully replaced atividades loop.")
else:
    print("Could not find the target code block.")
    # Print a snippet to help debug
    start_idx = content.find("const atividades: Array<{ id: string; modulo_id: string }> = [];")
    if start_idx != -1:
        print("Found start of block, but full match failed. Context:")
        print(content[start_idx:start_idx+500])
    else:
        print("Could not even find the start of the block.")
    sys.exit(1)
