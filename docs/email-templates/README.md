# Email Templates do Supabase Auth

Templates de e-mail em português para autenticação do Supabase.

## Templates Disponíveis

| Template | Arquivo | Supabase Config |
|----------|---------|-----------------|
| Confirmar cadastro | `confirm-signup.html` | Confirm signup |
| Convidar usuário | `invite-user.html` | Invite user |
| Link mágico | `magic-link.html` | Magic Link |
| Redefinir senha | `reset-password.html` | Reset Password |
| Alterar e-mail | `change-email.html` | Change Email Address |
| Reautenticação (OTP) | `reauthentication.html` | Reauthentication |

## Como Configurar

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Navegue até **Authentication → Email Templates**
3. Selecione o tipo de template (ex: "Confirm signup")
4. Cole o conteúdo HTML do arquivo correspondente
5. Clique em **Save**

## Variáveis Disponíveis

| Variável | Descrição | Uso |
|----------|-----------|-----|
| `{{ .ConfirmationURL }}` | Link de confirmação | Todos exceto Reauthentication |
| `{{ .Token }}` | Código OTP | Reauthentication |
| `{{ .SiteURL }}` | URL base do site | Opcional |
| `{{ .Data.campo }}` | Metadados do usuário | Opcional |

## Cores dos Templates

Cada template usa uma cor diferente para fácil identificação:

- **Azul** (#3b82f6) - Confirmar cadastro
- **Roxo** (#8b5cf6) - Convite
- **Verde** (#10b981) - Magic Link
- **Laranja** (#f59e0b) - Redefinir senha
- **Ciano** (#06b6d4) - Alterar e-mail
- **Rosa** (#ec4899) - Reautenticação

## Personalização com Tenant (Limitação)

O Supabase **não possui** variável nativa para nome do tenant. Para incluir o nome do tenant:

### Opção 1: Metadados no signup (recomendado)

```typescript
await supabase.auth.signUp({
  email: 'user@email.com',
  password: 'secret',
  options: {
    data: {
      tenant_name: 'Nome da Empresa'
    }
  }
})
```

Então no template:
```html
<p>Bem-vindo à {{ .Data.tenant_name }}!</p>
```

### Opção 2: Edge Function + Resend/Postmark

Para controle total, use uma Edge Function com provedor de e-mail externo (Resend, Postmark, SendGrid).

## Testando os Templates

Para visualizar os templates localmente, abra os arquivos `.html` diretamente no navegador.

> **Nota:** As variáveis `{{ .ConfirmationURL }}` etc. não serão renderizadas localmente - isso é normal.
