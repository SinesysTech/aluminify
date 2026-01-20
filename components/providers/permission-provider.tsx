'use client'

import React, { createContext, useContext, useMemo, useCallback } from 'react'
import type { RolePermissions, RoleTipo } from '@/types/shared/entities/papel'
import { hasPermission, canView, canCreate, canEdit, canDelete } from '@/lib/roles'

interface PermissionContextValue {
  permissions: RolePermissions | undefined
  roleType: RoleTipo | undefined
  isSuperAdmin: boolean
  hasPermission: (resource: keyof RolePermissions, action: 'view' | 'create' | 'edit' | 'delete') => boolean
  canView: (resource: keyof RolePermissions) => boolean
  canCreate: (resource: keyof RolePermissions) => boolean
  canEdit: (resource: keyof RolePermissions) => boolean
  canDelete: (resource: keyof RolePermissions) => boolean
  isTeachingRole: boolean
  isAdminRole: boolean
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

interface PermissionProviderProps {
  permissions?: RolePermissions
  roleType?: RoleTipo
  isSuperAdmin?: boolean
  children: React.ReactNode
}

export function PermissionProvider({
  permissions,
  roleType,
  isSuperAdmin = false,
  children,
}: PermissionProviderProps) {
  const checkPermission = useCallback(
    (resource: keyof RolePermissions, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
      if (isSuperAdmin) return true
      return hasPermission(permissions, resource, action)
    },
    [permissions, isSuperAdmin]
  )

  const checkCanView = useCallback(
    (resource: keyof RolePermissions): boolean => {
      if (isSuperAdmin) return true
      return canView(permissions, resource)
    },
    [permissions, isSuperAdmin]
  )

  const checkCanCreate = useCallback(
    (resource: keyof RolePermissions): boolean => {
      if (isSuperAdmin) return true
      return canCreate(permissions, resource)
    },
    [permissions, isSuperAdmin]
  )

  const checkCanEdit = useCallback(
    (resource: keyof RolePermissions): boolean => {
      if (isSuperAdmin) return true
      return canEdit(permissions, resource)
    },
    [permissions, isSuperAdmin]
  )

  const checkCanDelete = useCallback(
    (resource: keyof RolePermissions): boolean => {
      if (isSuperAdmin) return true
      return canDelete(permissions, resource)
    },
    [permissions, isSuperAdmin]
  )

  const isTeachingRole = useMemo(() => {
    if (!roleType) return false
    return ['professor', 'professor_admin', 'monitor'].includes(roleType)
  }, [roleType])

  const isAdminRole = useMemo(() => {
    if (isSuperAdmin) return true
    if (!roleType) return false
    return ['admin', 'professor_admin'].includes(roleType)
  }, [roleType, isSuperAdmin])

  const value = useMemo<PermissionContextValue>(
    () => ({
      permissions,
      roleType,
      isSuperAdmin,
      hasPermission: checkPermission,
      canView: checkCanView,
      canCreate: checkCanCreate,
      canEdit: checkCanEdit,
      canDelete: checkCanDelete,
      isTeachingRole,
      isAdminRole,
    }),
    [
      permissions,
      roleType,
      isSuperAdmin,
      checkPermission,
      checkCanView,
      checkCanCreate,
      checkCanEdit,
      checkCanDelete,
      isTeachingRole,
      isAdminRole,
    ]
  )

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissions() {
  const context = useContext(PermissionContext)

  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }

  return context
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(resource: keyof RolePermissions, action: 'view' | 'create' | 'edit' | 'delete') {
  const { hasPermission } = usePermissions()
  return hasPermission(resource, action)
}

/**
 * Hook to check if user can view a resource
 */
export function useCanView(resource: keyof RolePermissions) {
  const { canView } = usePermissions()
  return canView(resource)
}

/**
 * Hook to check if user can create a resource
 */
export function useCanCreate(resource: keyof RolePermissions) {
  const { canCreate } = usePermissions()
  return canCreate(resource)
}

/**
 * Hook to check if user can edit a resource
 */
export function useCanEdit(resource: keyof RolePermissions) {
  const { canEdit } = usePermissions()
  return canEdit(resource)
}

/**
 * Hook to check if user can delete a resource
 */
export function useCanDelete(resource: keyof RolePermissions) {
  const { canDelete } = usePermissions()
  return canDelete(resource)
}

/**
 * Component that conditionally renders children based on permission
 */
interface PermissionGateProps {
  resource: keyof RolePermissions
  action: 'view' | 'create' | 'edit' | 'delete'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ resource, action, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, isSuperAdmin } = usePermissions()

  if (isSuperAdmin || hasPermission(resource, action)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Component that conditionally renders children for admin users only
 */
interface AdminGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminGate({ children, fallback = null }: AdminGateProps) {
  const { isAdminRole } = usePermissions()

  if (isAdminRole) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Component that conditionally renders children for teaching role users only
 */
interface TeachingGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function TeachingGate({ children, fallback = null }: TeachingGateProps) {
  const { isTeachingRole } = usePermissions()

  if (isTeachingRole) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
