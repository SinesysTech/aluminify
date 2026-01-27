# Docker Build - Aluminify

Guia para build e deploy da imagem Docker do Aluminify (Next.js).

## Arquitetura

```
┌─────────────────────────────────────────┐
│           Container Docker              │
│                                         │
│  ┌─────────────┐                        │
│  │   Next.js   │                        │
│  │  :3000      │                        │
│  └─────────────┘                        │
└─────────────────────────────────────────┘
```

## Variáveis de Ambiente

As seguintes variáveis são necessárias no momento do **build** (ARGs):

### Supabase (Obrigatório)

| Variável                                       | Descrição                             | Obrigatório |
| ---------------------------------------------- | ------------------------------------- | ----------- |
| `SUPABASE_URL`                                 | URL do projeto Supabase (server-side) | Sim         |
| `NEXT_PUBLIC_SUPABASE_URL`                     | URL do projeto Supabase (client-side) | Sim         |
| `SUPABASE_SECRET_KEY`                          | Service role key do Supabase          | Sim         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Chave pública do Supabase             | Sim         |

### Redis (Obrigatório)

| Variável                   | Descrição              | Obrigatório |
| -------------------------- | ---------------------- | ----------- |
| `UPSTASH_REDIS_REST_URL`   | URL do Redis Upstash   | Sim         |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Redis Upstash | Sim         |

### Superadmin (Obrigatório)

| Variável              | Descrição              | Obrigatório |
| --------------------- | ---------------------- | ----------- |
| `SUPERADMIN_USERNAME` | Username do superadmin | Sim         |
| `SUPERADMIN_PASSWORD` | Password do superadmin | Sim         |

### Analytics (Opcional)

| Variável                        | Descrição              | Obrigatório |
| ------------------------------- | ---------------------- | ----------- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ID do Google Analytics | Não         |

> As variáveis `NEXT_PUBLIC_*` são embutidas no build do Next.js e não podem ser alteradas em runtime.

## Build e Push (Comando Único)

### Método Recomendado: docker-compose

```bash
# Build e push em um comando
docker-compose -f docker-compose.prod.yml build && docker push sinesystec/aluminify:latest
```

### Build + Push Manual (Linux AMD64)

```bash
# Carregar variáveis, buildar e fazer push
export $(grep -v '^#' .env.local | xargs) && \
docker build --platform linux/amd64 \
  --build-arg SUPABASE_URL=$SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY \
  --build-arg UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL \
  --build-arg UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN \
  --build-arg SUPERADMIN_USERNAME=$SUPERADMIN_USERNAME \
  --build-arg SUPERADMIN_PASSWORD=$SUPERADMIN_PASSWORD \
  --build-arg AI_MODEL_PROVIDER=$AI_MODEL_PROVIDER \
  --build-arg GOOGLE_GENERATIVE_AI_API_KEY=$GOOGLE_GENERATIVE_AI_API_KEY \
  --build-arg OPENAI_API_KEY=$OPENAI_API_KEY \
  --build-arg LOG_LEVEL=$LOG_LEVEL \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID \
  -t sinesystec/aluminify:latest . && \
docker push sinesystec/aluminify:latest
```

### Build + Push sem Cache

```bash
export $(grep -v '^#' .env.local | xargs) && \
docker build --platform linux/amd64 --no-cache \
  --build-arg SUPABASE_URL=$SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY \
  --build-arg UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL \
  --build-arg UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN \
  --build-arg SUPERADMIN_USERNAME=$SUPERADMIN_USERNAME \
  --build-arg SUPERADMIN_PASSWORD=$SUPERADMIN_PASSWORD \
  --build-arg AI_MODEL_PROVIDER=$AI_MODEL_PROVIDER \
  --build-arg GOOGLE_GENERATIVE_AI_API_KEY=$GOOGLE_GENERATIVE_AI_API_KEY \
  --build-arg OPENAI_API_KEY=$OPENAI_API_KEY \
  --build-arg LOG_LEVEL=$LOG_LEVEL \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID \
  -t sinesystec/aluminify:latest . && \
docker push sinesystec/aluminify:latest
```

## Pré-requisitos

Antes de fazer push, faça login no Docker Hub:

```bash
docker login
```

## Executar Container

### Produção (com docker-compose)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Produção (pull + run)

```bash
docker pull sinesystec/aluminify:latest && \
docker run -d \
  --name aluminify \
  --platform linux/amd64 \
  -p 3000:3000 \
  --env-file .env.local \
  --restart always \
  sinesystec/aluminify:latest
```

### Desenvolvimento

```bash
docker-compose up -d
```

## URLs dos Serviços

| Serviço      | Porta | URL                              |
| ------------ | ----- | -------------------------------- |
| Next.js      | 3000  | http://localhost:3000            |
| Health Check | 3000  | http://localhost:3000/api/health |

## Comandos Úteis

```bash
# Ver logs
docker logs -f aluminify

# Parar container
docker stop aluminify

# Remover container
docker rm aluminify

# Verificar saúde do container
docker inspect --format='{{.State.Health.Status}}' aluminify

# Acessar shell do container
docker exec -it aluminify sh

# Ver imagens locais
docker images | grep aluminify
```

## Estrutura de Build

O Dockerfile usa multi-stage build:

1. **Stage builder**: Instala dependências, builda Next.js
2. **Stage runner**: Imagem final otimizada para produção

Arquivos copiados para a imagem final:

- `.next/` - Build do Next.js
- `node_modules/` - Dependências de produção
- `public/` - Assets estáticos
- `start.sh` - Script de inicialização
