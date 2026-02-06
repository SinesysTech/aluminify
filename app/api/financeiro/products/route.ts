import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { createProductRepository, type ProductListParams } from "@/app/[tenant]/(modules)/financeiro/services";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";
import type { Provider } from "@/app/[tenant]/(modules)/financeiro/services/financial.types";

const serializeProduct = (
  product: Awaited<ReturnType<ReturnType<typeof createProductRepository>["findById"]>>
) => {
  if (!product) return null;
  return {
    id: product.id,
    empresaId: product.empresaId,
    cursoId: product.cursoId,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    price: product.priceCents / 100,
    currency: product.currency,
    provider: product.provider,
    providerProductId: product.providerProductId,
    providerOfferId: product.providerOfferId,
    active: product.active,
    metadata: product.metadata,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
};

function handleError(error: unknown) {
  console.error("Products API Error:", error);

  let errorMessage = "Internal server error";
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  );
}

// GET - List products with filters
async function getHandler(request: AuthenticatedRequest) {
  try {
    const user = request.user;
    if (!user?.empresaId) {
      return NextResponse.json(
        { error: "Empresa not found for user" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const params: ProductListParams = {
      empresaId: user.empresaId,
    };

    // Pagination
    const page = searchParams.get("page");
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        params.page = pageNum;
      }
    }

    const pageSize = searchParams.get("pageSize");
    if (pageSize) {
      const pageSizeNum = parseInt(pageSize, 10);
      if (!isNaN(pageSizeNum) && pageSizeNum > 0) {
        params.pageSize = pageSizeNum;
      }
    }

    // Filters
    const cursoId = searchParams.get("cursoId");
    if (cursoId) {
      params.cursoId = cursoId;
    }

    const provider = searchParams.get("provider") as Provider | null;
    if (provider) {
      params.provider = provider;
    }

    const active = searchParams.get("active");
    if (active === "true") {
      params.active = true;
    } else if (active === "false") {
      params.active = false;
    }

    // Sorting
    const sortBy = searchParams.get("sortBy") as "name" | "price_cents" | "created_at" | null;
    if (sortBy) {
      params.sortBy = sortBy;
    }

    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;
    if (sortOrder) {
      params.sortOrder = sortOrder;
    }

    const client = getDatabaseClient();
    const repository = createProductRepository(client);
    const result = await repository.list(params);

    return NextResponse.json({
      data: result.data.map(serializeProduct),
      meta: result.meta,
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST - Create product
async function postHandler(request: AuthenticatedRequest) {
  try {
    const user = request.user;
    if (!user?.empresaId) {
      return NextResponse.json(
        { error: "Empresa not found for user" },
        { status: 403 }
      );
    }

    // Check if user is admin
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can create products" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    if (body.priceCents === undefined || body.priceCents === null) {
      return NextResponse.json(
        { error: "Missing required field: priceCents" },
        { status: 400 }
      );
    }

    const client = getDatabaseClient();
    const repository = createProductRepository(client);

    const product = await repository.create({
      empresaId: user.empresaId,
      cursoId: body.cursoId ?? null,
      name: body.name,
      description: body.description ?? null,
      priceCents: body.priceCents,
      currency: body.currency ?? "BRL",
      provider: body.provider ?? "internal",
      providerProductId: body.providerProductId ?? null,
      providerOfferId: body.providerOfferId ?? null,
      active: body.active ?? true,
      metadata: body.metadata ?? {},
    });

    return NextResponse.json(
      { data: serializeProduct(product) },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
