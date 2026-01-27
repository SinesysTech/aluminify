# Docker Build - Aluminify

Guia para build e deploy da imagem Docker do Aluminify (Next.js + Mastra Studio).

## Arquitetura

```
┌─────────────────────────────────────────┐
│           Container Docker              │
│                                         │
│  ┌─────────────┐    ┌────────────────┐  │
│  │   Next.js   │    │ Mastra Studio  │  │
│  │  :3000      │    │  :4111         │  │
│  └─────────────┘    └────────────────┘  │
└─────────────────────────────────────────┘
```

## Variáveis de Ambiente

As seguintes variáveis são necessárias no momento do **build** (ARGs):

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Chave pública do Supabase |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ID do Google Analytics |
| `UPSTASH_REDIS_REST_URL` | URL do Redis Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Redis Upstash |

> As variáveis `NEXT_PUBLIC_*` são embutidas no build do Next.js e não podem ser alteradas em runtime.

## Build da Imagem

### Método Recomendado: docker-compose (já consome .env.local)

```bash
docker-compose -f docker-compose.prod.yml build
```

### Build Manual para Linux AMD64

Carregue as variáveis do `.env.local` e execute o build:

```bash
# Carregar variáveis e buildar
export $(grep -v '^#' .env.local | xargs) && \
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID \
  --build-arg UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL \
  --build-arg UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN \
  -t aluminify:latest .
```

### Build com tag para Docker Hub

```bash
export $(grep -v '^#' .env.local | xargs) && \
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID \
  --build-arg UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL \
  --build-arg UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN \
  -t sinesystec/aluminify:latest .
```

### Build sem cache

```bash
export $(grep -v '^#' .env.local | xargs) && \
docker build --platform linux/amd64 --no-cache \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID \
  --build-arg UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL \
  --build-arg UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN \
  -t aluminify:latest .
```

## Executar Container

### Produção (com docker-compose)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Produção (apenas docker)

```bash
docker run -d \
  --name aluminify \
  --platform linux/amd64 \
  -p 3000:3000 \
  -p 4111:4111 \
  --env-file .env.local \
  --restart always \
  aluminify:latest
```

### Desenvolvimento

```bash
docker-compose up -d
```

## Push para Docker Hub

```bash
# Login no Docker Hub
docker login

# Push da imagem
docker push sinesystec/aluminify:latest
```

## URLs dos Serviços

| Serviço | Porta | URL |
|---------|-------|-----|
| Next.js | 3000 | http://localhost:3000 |
| Mastra Studio | 4111 | http://localhost:4111 |
| Swagger API | 4111 | http://localhost:4111/swagger-ui |
| Health Check | 3000 | http://localhost:3000/api/health |

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
```

## Estrutura de Build

O Dockerfile usa multi-stage build:

1. **Stage builder**: Instala dependências, builda Next.js e Mastra
2. **Stage runner**: Imagem final otimizada para produção

Arquivos copiados para a imagem final:
- `.next/` - Build do Next.js
- `.mastra/output/` - Build do Mastra com Studio
- `node_modules/` - Dependências de produção
- `public/` - Assets estáticos
- `start.sh` - Script de inicialização
