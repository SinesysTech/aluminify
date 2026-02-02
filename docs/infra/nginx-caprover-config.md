# Configuração do Nginx no CapRover

## Problema Resolvido
Erros 502 "upstream sent too big header" causados por headers HTTP grandes.

## Configuração Aplicada
- `proxy_buffer_size`: 16k
- `proxy_buffers`: 8 16k
- `large_client_header_buffers`: 8 16k

## Localização
`/captain/nginx/conf.d/aluminify-custom.conf`

## Como Aplicar Mudanças
1. SSH no servidor CapRover
2. Editar arquivo de configuração
3. Testar: `nginx -t`
4. Reiniciar: `docker service update --force captain-nginx`
