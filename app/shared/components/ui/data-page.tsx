"use client"

import * as React from "react"
import { cn } from "@/app/shared/core/utils"
import { LucideIcon } from "lucide-react"

/**
 * DataPageContainer
 * Container principal para páginas de dados com tabelas.
 * Aplica o espaçamento padrão entre seções (gap-8) e padding inferior (pb-10).
 */
interface DataPageContainerProps {
  children: React.ReactNode
  className?: string
}

function DataPageContainer({ children, className }: DataPageContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-8 h-full pb-10",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * DataPageHeader
 * Header padrão para páginas de dados com título, descrição e ações.
 */
interface DataPageHeaderProps {
  title: string
  description: string
  actions?: React.ReactNode
  className?: string
}

function DataPageHeader({ title, description, actions, className }: DataPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4",
        className
      )}
    >
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}

/**
 * DataPageFilters
 * Container para filtros com espaçamento padronizado (gap-3).
 */
interface DataPageFiltersProps {
  children: React.ReactNode
  className?: string
}

function DataPageFilters({ children, className }: DataPageFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-3",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * DataPagePagination
 * Componente de paginação padronizado.
 */
interface DataPagePaginationProps {
  totalCount: number
  onPrevious: () => void
  onNext: () => void
  canPreviousPage: boolean
  canNextPage: boolean
  className?: string
}

function DataPagePagination({
  totalCount,
  onPrevious,
  onNext,
  canPreviousPage,
  canNextPage,
  className,
}: DataPagePaginationProps) {
  return (
    <div
      className={cn(
        "border-t border-[#E4E4E7] px-4 py-3 flex items-center justify-between",
        className
      )}
    >
      <span className="text-xs text-[#71717A]">
        Mostrando <strong>{totalCount}</strong> resultados
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={!canPreviousPage}
          className="px-3 py-1 border border-[#E4E4E7] bg-white rounded text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={!canNextPage}
          className="px-3 py-1 border border-[#E4E4E7] bg-white rounded text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Próximo
        </button>
      </div>
    </div>
  )
}

/**
 * DataPageEmptyState
 * Estado vazio padronizado para páginas de dados.
 */
interface DataPageEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actions?: React.ReactNode
  className?: string
}

function DataPageEmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: DataPageEmptyStateProps) {
  return (
    <section
      className={cn(
        "flex-1 flex flex-col items-center justify-center min-h-[400px]",
        className
      )}
    >
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-[#E4E4E7]">
        <Icon className="w-8 h-8 text-zinc-400" strokeWidth={1} />
      </div>

      <h3 className="empty-state-title mb-2">
        {title}
      </h3>
      <p className="section-subtitle text-center max-w-sm mb-8 leading-relaxed">
        {description}
      </p>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </section>
  )
}

/**
 * DataPageTableWrapper
 * Wrapper para a tabela desktop sem bordas extras.
 */
interface DataPageTableWrapperProps {
  children: React.ReactNode
  className?: string
}

function DataPageTableWrapper({ children, className }: DataPageTableWrapperProps) {
  return (
    <div className={cn("hidden md:block overflow-hidden flex-1", className)}>
      {children}
    </div>
  )
}

/**
 * DataPageMobileCards
 * Container para cards mobile com espaçamento padronizado.
 */
interface DataPageMobileCardsProps {
  children: React.ReactNode
  className?: string
}

function DataPageMobileCards({ children, className }: DataPageMobileCardsProps) {
  return (
    <div className={cn("block md:hidden space-y-4", className)}>
      {children}
    </div>
  )
}

/**
 * DataPagePrimaryButton
 * Botão primário padronizado para ações principais (ex: "Novo Curso").
 */
interface DataPagePrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

function DataPagePrimaryButton({ children, className, ...props }: DataPagePrimaryButtonProps) {
  return (
    <button
      className={cn(
        "h-9 px-4 rounded-md bg-[#09090B] text-white text-sm font-medium hover:bg-[#27272A] transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * DataPageSecondaryButton
 * Botão secundário padronizado para ações secundárias (ex: "Importar CSV").
 */
interface DataPageSecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

function DataPageSecondaryButton({ children, className, ...props }: DataPageSecondaryButtonProps) {
  return (
    <button
      className={cn(
        "h-9 px-4 rounded-md border border-[#E4E4E7] bg-white text-sm font-medium hover:bg-zinc-50 transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center gap-2 text-zinc-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * DataPageSearchInput
 * Input de busca padronizado com ícone.
 */
interface DataPageSearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  defaultValue?: string
  className?: string
  icon?: React.ReactNode
}

function DataPageSearchInput({
  placeholder = "Buscar...",
  value,
  onChange,
  defaultValue,
  className,
  icon,
}: DataPageSearchInputProps) {
  return (
    <div className={cn("relative flex-1 max-w-sm", className)}>
      {icon && (
        <div className="absolute left-2.5 top-2.5 w-5 h-5 text-zinc-400">
          {icon}
        </div>
      )}
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          "w-full h-10 pr-4 rounded-md border border-[#E4E4E7] bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all",
          icon ? "pl-9" : "pl-4"
        )}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        defaultValue={defaultValue}
      />
    </div>
  )
}

export {
  DataPageContainer,
  DataPageHeader,
  DataPageFilters,
  DataPagePagination,
  DataPageEmptyState,
  DataPageTableWrapper,
  DataPageMobileCards,
  DataPagePrimaryButton,
  DataPageSecondaryButton,
  DataPageSearchInput,
}
