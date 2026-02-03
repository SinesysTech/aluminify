import sys

file_path = "app/[tenant]/(modules)/dashboard/services/dashboard-analytics.service.ts"

with open(file_path, "r") as f:
    content = f.read()

search_text = """    // 5) Progresso concluído com questões
    const progressos: Array<{
      atividade_id: string;
      questoes_totais: number | null;
      questoes_acertos: number | null;
    }> = [];
    const inicioPeriodo = this.getPeriodStart(opts.period);
    for (const idsChunk of chunk(atividadeIds, 900)) {
      let q = client
        .from("progresso_atividades")
        .select("atividade_id, questoes_totais, questoes_acertos")
        .eq("usuario_id", alunoId)
        .eq("status", "Concluido")
        .not("questoes_totais", "is", null)
        .gt("questoes_totais", 0)
        .gte("data_conclusao", inicioPeriodo.toISOString())
        .in("atividade_id", idsChunk);
      if (opts.empresaId) q = q.eq("empresa_id", opts.empresaId);
      const { data: chunkRows, error: chunkErr } = await q;
      if (chunkErr) {
        console.error(
          "[dashboard-analytics] Erro ao buscar progresso_atividades por atividade_id:",
          chunkErr,
        );
        continue;
      }
      progressos.push(
        ...(((chunkRows ?? []) as Array<{
          atividade_id: string;
          questoes_totais: number | null;
          questoes_acertos: number | null;
        }>) ?? []),
      );
    }"""

replace_text = """    // 5) Progresso concluído com questões
    const inicioPeriodo = this.getPeriodStart(opts.period);
    const progressosPromises = chunk(atividadeIds, 900).map(async (idsChunk) => {
      let q = client
        .from("progresso_atividades")
        .select("atividade_id, questoes_totais, questoes_acertos")
        .eq("usuario_id", alunoId)
        .eq("status", "Concluido")
        .not("questoes_totais", "is", null)
        .gt("questoes_totais", 0)
        .gte("data_conclusao", inicioPeriodo.toISOString())
        .in("atividade_id", idsChunk);
      if (opts.empresaId) q = q.eq("empresa_id", opts.empresaId);
      const { data: chunkRows, error: chunkErr } = await q;
      if (chunkErr) {
        console.error(
          "[dashboard-analytics] Erro ao buscar progresso_atividades por atividade_id:",
          chunkErr,
        );
        return [];
      }
      return (chunkRows ?? []) as Array<{
        atividade_id: string;
        questoes_totais: number | null;
        questoes_acertos: number | null;
      }>;
    });

    const progressos = (await Promise.all(progressosPromises)).flat();"""

if search_text in content:
    new_content = content.replace(search_text, replace_text)
    with open(file_path, "w") as f:
        f.write(new_content)
    print("Successfully replaced progressos loop.")
else:
    print("Could not find the target code block.")
    # Print a snippet to help debug
    start_idx = content.find("const progressos: Array<{")
    if start_idx != -1:
        print("Found start of block, but full match failed. Context:")
        print(content[start_idx:start_idx+500])
    else:
        print("Could not even find the start of the block.")
    sys.exit(1)
