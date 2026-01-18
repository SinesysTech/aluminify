'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket, School } from 'lucide-react'
import { AuthPageLayout } from '@/components/auth/auth-page-layout'
import { SignupDecorativeTerminal } from '@/components/auth/signup-decorative-terminal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [organization, setOrganization] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    if (!firstName || !lastName || !organization || !email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome, sobrenome, organização, email e senha.',
        variant: 'destructive',
      })
      return
    }

    if (!acceptTerms) {
      toast({
        title: 'Termos de Serviço',
        description: 'Você precisa aceitar os termos para continuar.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Senha fraca',
        description: 'A senha precisa ter pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()

      const response = await fetch('/api/auth/signup-with-empresa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName,
          empresaNome: organization.trim(),
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null

      if (!response.ok) {
        const message = data?.error || 'Erro ao inicializar instância'

        if (message.includes('já está cadastrado') || message.includes('already registered')) {
          toast({
            title: 'Conta já existe',
            description: 'Este email já possui uma conta. Por favor, faça login.',
            variant: 'destructive',
            action: (
              <Link href="/auth" className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                Fazer Login
              </Link>
            ),
          })
          return
        }

        toast({
          title: 'Não foi possível criar sua conta',
          description: message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Instância criada!',
        description:
          data?.message ||
          'Sua conta e empresa foram criadas. Você já pode fazer login.',
      })

      router.push('/auth/sign-up-success')
    } catch (error) {
      console.error('[sign-up] Erro ao fazer signup:', error)
      toast({
        title: 'Erro inesperado',
        description:
          error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid =
    firstName && lastName && organization && email && password && acceptTerms

  return (
    <AuthPageLayout
      formSide="right"
      formWidth="520px"
      decorativeBackground="dark"
      decorativeContent={<SignupDecorativeTerminal />}
      footerContent={
        <p>
          Já tem uma conta?{' '}
          <Link
            href="/auth"
            className="font-medium text-primary hover:underline"
          >
            Fazer login
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        {/* Badge */}
        <Badge className="border-transparent bg-primary text-primary-foreground shadow-none hover:bg-primary">
          Early Access
        </Badge>

        {/* Header */}
        <div>
          <h1 className="font-sans text-3xl font-bold text-gray-900">
            Inicializar nova instância
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure sua infraestrutura educacional em minutos. Sem cartão de
            crédito necessário.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="João"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Silva"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="organization">Nome da Organização</Label>
            <div className="relative">
              <School className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="organization"
                type="text"
                placeholder="Escola Exemplo"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                disabled={isLoading}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email de Trabalho</Label>
            <Input
              id="email"
              type="email"
              placeholder="joao@escola.edu.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Senha Master</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, incluindo maiúscula, número e símbolo
            </p>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              disabled={isLoading}
              className="mt-0.5"
            />
            <Label
              htmlFor="terms"
              className="text-sm font-normal leading-5 text-muted-foreground"
            >
              Concordo com os{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Termos de Serviço
              </Link>{' '}
              e{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
            </Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isFormValid}
          >
            <Rocket className="mr-2 h-4 w-4" />
            {isLoading ? 'Fazendo deploy...' : 'Fazer Deploy da Instância'}
          </Button>
        </form>
      </div>
    </AuthPageLayout>
  )
}
