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

## Build da Imagem

### Build para Linux AMD64

```bash
docker build --platform linux/amd64 -t aluminify:latest .
```

### Build com tag para registry

```bash
docker build --platform linux/amd64 -t seu-registry.com/aluminify:latest .
```

### Build com versão específica

```bash
docker build --platform linux/amd64 -t aluminify:1.0.0 .
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

## Push para Registry

```bash
# Login no registry
docker login seu-registry.com

# Push da imagem
docker push seu-registry.com/aluminify:latest
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

# Rebuild sem cache
docker build --platform linux/amd64 --no-cache -t aluminify:latest .

# Verificar saúde do container
docker inspect --format='{{.State.Health.Status}}' aluminify
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
