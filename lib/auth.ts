import { redirect } from 'next/navigation'

import { createClient } from '@/lib/server'
import type { AppUser, AppUserRole } from '@/types/user'
import { getDefaultRouteForRole, hasRequiredRole } from '@/lib/roles'

export async function getAuthenticatedUser(): Promise<AppUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const role = (user.user_metadata?.role as AppUserRole) || 'aluno'
  let mustChangePassword = Boolean(user.user_metadata?.must_change_password)

  // Ensure professor record exists if user is a professor
  // Note: This is a best-effort attempt. The handle_new_user() trigger should have created it,
  // but this ensures it exists even if the trigger didn't fire or if the user was created differently.
  if (role === 'professor' || role === 'superadmin') {
    try {
      // Check if professor record exists
      const { data: existingProfessor, error: checkError } = await supabase
        .from('professores')
        .select('id, email')
        .eq('id', user.id)
        .maybeSingle()

      // Only proceed if we successfully checked (no error) and record doesn't exist
      if (!checkError && !existingProfessor) {
        // Try to create the record, but don't fail if RLS blocks it
        // The trigger should have created it, so this is just a safety net
        const { error: insertError } = await supabase
          .from('professores')
          .insert({
            id: user.id,
            email: user.email || '',
            nome_completo: user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'Novo Professor'
          })

        // Only log if there's an actual error (not just RLS blocking)
        // Most errors here are expected if RLS policy isn't set up yet
        if (insertError && insertError.code !== '42501') {
          // 42501 is permission denied - this is expected if policy doesn't exist yet
          console.debug('Could not auto-create professor record (may need RLS policy):', {
            code: insertError.code,
            message: insertError.message
          })
        }
      } else if (!checkError && existingProfessor && existingProfessor.email !== user.email) {
        // Update email if it has changed
        await supabase
          .from('professores')
          .update({ email: user.email || '' })
          .eq('id', user.id)
      }
    } catch (error) {
      // Silently ignore - this is a best-effort operation
      // The handle_new_user trigger should handle record creation
      if (process.env.NODE_ENV === 'development') {
        console.debug('Error ensuring professor record (non-critical):', error)
      }
    }
  }

  if (role === 'aluno') {
    const { data: alunoData } = await supabase
      .from('alunos')
      .select('must_change_password')
      .eq('id', user.id)
      .maybeSingle()

    if (alunoData?.must_change_password !== undefined) {
      mustChangePassword = alunoData.must_change_password
    }
  }

  return {
    id: user.id,
    email: user.email || '',
    role,
    fullName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0],
    avatarUrl: user.user_metadata?.avatar_url,
    mustChangePassword,
  }
}

type RequireUserOptions = {
  allowedRoles?: AppUserRole[]
  ignorePasswordRequirement?: boolean
}

export async function requireUser(options?: RequireUserOptions): Promise<AppUser> {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/auth')
  }

  if (options?.allowedRoles && !hasRequiredRole(user.role, options.allowedRoles)) {
    redirect(getDefaultRouteForRole(user.role))
  }

  if (!options?.ignorePasswordRequirement && user.mustChangePassword) {
    redirect('/primeiro-acesso')
  }

  return user
}

