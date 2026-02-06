import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { createProductRepository } from "@/app/[tenant]/(modules)/financeiro/services";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";
import type { UpdateProductInput } from "@/app/[tenant]/(modules)/financeiro/services/financial.types";

interface RouteContext {
  params: { id: string };
}

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
  console.error("Product API Error:", error);

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

// GET - Get product by ID
async function getHandler(request: AuthenticatedRequest, context?: Record<string, unknown>) {
  try {
    const user = request.user;
    if (!user?.empresaId) {
      return NextResponse.json(
        { error: "Empresa not found for user" },
        { status: 403 }
      );
    }

    const { id } = (context as unknown as RouteContext).params;

    const client = getDatabaseClient();
    const repository = createProductRepository(client);
    const product = await repository.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify product belongs to user's empresa
    if (product.empresaId !== user.empresaId) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: serializeProduct(product) });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH - Update product
async function patchHandler(request: AuthenticatedRequest, context?: Record<string, unknown>) {
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
        { error: "Only admins can update products" },
        { status: 403 }
      );
    }

    const { id } = (context as unknown as RouteContext).params;
    const body = await request.json();

    const client = getDatabaseClient();
    const repository = createProductRepository(client);

    // Verify product exists and belongs to user's empresa
    const existing = await repository.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (existing.empresaId !== user.empresaId) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Build update payload
    const updatePayload: UpdateProductInput = {};

    if (body.cursoId !== undefined) updatePayload.cursoId = body.cursoId;
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.priceCents !== undefined) updatePayload.priceCents = body.priceCents;
    if (body.currency !== undefined) updatePayload.currency = body.currency;
    if (body.providerProductId !== undefined) updatePayload.providerProductId = body.providerProductId;
    if (body.providerOfferId !== undefined) updatePayload.providerOfferId = body.providerOfferId;
    if (body.active !== undefined) updatePayload.active = body.active;
    if (body.metadata !== undefined) updatePayload.metadata = body.metadata;

    const product = await repository.update(id, updatePayload);

    return NextResponse.json({ data: serializeProduct(product) });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - Delete product
async function deleteHandler(request: AuthenticatedRequest, context?: Record<string, unknown>) {
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
        { error: "Only admins can delete products" },
        { status: 403 }
      );
    }

    const { id } = (context as unknown as RouteContext).params;

    const client = getDatabaseClient();
    const repository = createProductRepository(client);

    // Verify product exists and belongs to user's empresa
    const existing = await repository.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (existing.empresaId !== user.empresaId) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await repository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
export const PATCH = requireAuth(patchHandler);
export const DELETE = requireAuth(deleteHandler);
