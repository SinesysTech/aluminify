"use server";

/**
 * Agendamentos Actions Index
 *
 * This file re-exports all functions from specialized modules to maintain
 * backward compatibility while allowing a more modular and maintainable structure.
 */

export * from "../types";
export * from "./availability-actions";
export * from "./appointment-actions";
export * from "./config-actions";
export * from "./recurrence-actions";
export * from "./validation-actions";
export * from "./report-actions";
export * from "./professor-selection-actions";
