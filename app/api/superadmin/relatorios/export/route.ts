import { NextRequest, NextResponse } from "next/server"
import { getDatabaseClient } from "@/app/shared/core/database/database"
import { getAuthUser } from "@/app/[tenant]/auth/middleware"

/**
 * GET /api/superadmin/relatorios/export
 * Exporta dados em CSV ou JSON (apenas superadmin)
 *
 * Query params:
 * - type: "empresas" | "professores" | "alunos"
 * - format: "csv" | "json"
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmin pode acessar esta rota." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "empresas"
    const format = searchParams.get("format") || "csv"

    const adminClient = getDatabaseClient()

    let data: Record<string, unknown>[] = []
    let filename = ""

    switch (type) {
      case "empresas": {
        const { data: empresas } = await adminClient
          .from("empresas")
          .select(
            `
            id,
            nome,
            slug,
            cnpj,
            email_contato,
            telefone,
            plano,
            ativo,
            created_at
          `
          )
          .is("deleted_at", null)
          .order("created_at", { ascending: false })

        data = (empresas || []).map((e) => ({
          id: e.id,
          nome: e.nome,
          slug: e.slug,
          cnpj: e.cnpj || "",
          email: e.email_contato || "",
          telefone: e.telefone || "",
          plano: e.plano,
          status: e.ativo ? "Ativo" : "Inativo",
          criado_em: new Date(e.created_at).toLocaleDateString("pt-BR"),
        }))
        filename = `empresas_${new Date().toISOString().split("T")[0]}`
        break
      }

      case "professores": {
        const { data: professores } = await adminClient
          .from("professores")
          .select(
            `
            id,
            nome_completo,
            email,
            cpf,
            telefone,
            especialidade,
            is_admin,
            empresa_id,
            created_at,
            empresas:empresa_id (
              nome
            )
          `
          )
          .is("deleted_at", null)
          .order("created_at", { ascending: false })

        data = (professores || []).map((p) => {
          const empresa = p.empresas as { nome: string } | null
          return {
            id: p.id,
            nome: p.nome_completo || "",
            email: p.email,
            cpf: p.cpf || "",
            telefone: p.telefone || "",
            especialidade: p.especialidade || "",
            tipo: p.is_admin ? "Administrador" : "Professor",
            empresa: empresa?.nome || "Sem empresa",
            criado_em: new Date(p.created_at).toLocaleDateString("pt-BR"),
          }
        })
        filename = `professores_${new Date().toISOString().split("T")[0]}`
        break
      }

      case "alunos": {
        const { data: alunos } = await adminClient
          .from("alunos")
          .select(
            `
            id,
            nome_completo,
            email,
            cpf,
            telefone,
            empresa_id,
            created_at,
            empresas:empresa_id (
              nome
            )
          `
          )
          .is("deleted_at", null)
          .order("created_at", { ascending: false })

        data = (alunos || []).map((a) => {
          const empresa = a.empresas as { nome: string } | null
          return {
            id: a.id,
            nome: a.nome_completo || "",
            email: a.email,
            cpf: a.cpf || "",
            telefone: a.telefone || "",
            empresa: empresa?.nome || "Sem empresa",
            criado_em: new Date(a.created_at).toLocaleDateString("pt-BR"),
          }
        })
        filename = `alunos_${new Date().toISOString().split("T")[0]}`
        break
      }

      default:
        return NextResponse.json(
          { error: "Tipo de exportação inválido" },
          { status: 400 }
        )
    }

    if (format === "json") {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      })
    }

    // CSV format
    if (data.length === 0) {
      return new NextResponse("Nenhum dado encontrado", {
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escape quotes and wrap in quotes if contains comma
            const strValue = String(value ?? "")
            if (strValue.includes(",") || strValue.includes('"')) {
              return `"${strValue.replace(/"/g, '""')}"`
            }
            return strValue
          })
          .join(",")
      ),
    ]

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error in export endpoint:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
