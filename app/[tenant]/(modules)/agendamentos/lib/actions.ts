"use server";

/**
 * Agendamentos Actions Index
 *
 * This file re-exports all server action functions from specialized modules to maintain
 * backward compatibility while allowing a more modular and maintainable structure.
 *
 * NOTE: Types should be imported directly from "@/app/[tenant]/(modules)/agendamentos/types"
 * because "use server" files can only export async server action functions.
 */

export * from "./availability-actions";
export * from "./appointment-actions";
export * from "./config-actions";
export * from "./recurrence-actions";
export * from "./validation-actions";
export * from "./report-actions";
export * from "./professor-selection-actions";
