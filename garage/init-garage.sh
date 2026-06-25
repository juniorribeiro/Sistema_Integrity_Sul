#!/bin/bash
set -euo pipefail
#
# Inicialização do cluster Garage — executar UMA VEZ após o primeiro `docker compose up`.
# Cria o layout do cluster, a chave de acesso da aplicação e todos os buckets.
#
# Uso:
#   ./garage/init-garage.sh
#
# Ao final, copie o Access Key ID e o Secret Key impressos para o .env
# (GARAGE_ACCESS_KEY e GARAGE_SECRET_KEY) e reinicie o backend.

CONTAINER="integrity_garage"

echo "==> Aguardando o Garage ficar pronto..."
sleep 5

echo "==> Obtendo Node ID..."
NODE_ID=$(docker exec "$CONTAINER" /garage status | grep -oE '[a-f0-9]{16,}' | head -1)
if [ -z "${NODE_ID:-}" ]; then
  echo "ERRO: não foi possível obter o Node ID. O container '$CONTAINER' está rodando?" >&2
  exit 1
fi
echo "    Node ID: $NODE_ID"

echo "==> Criando layout do cluster (zona dc1, 10G)..."
docker exec "$CONTAINER" /garage layout assign -z dc1 -c 10G "$NODE_ID"
docker exec "$CONTAINER" /garage layout apply --version 1

echo "==> Criando chave de acesso da aplicação..."
docker exec "$CONTAINER" /garage key create integrity-app-key

echo "==> Criando buckets e concedendo permissões..."
for bucket in laudos-psicologia exames-nutricao docs-juridico docs-financeiro curriculos avatares; do
  docker exec "$CONTAINER" /garage bucket create "$bucket"
  docker exec "$CONTAINER" /garage bucket allow "$bucket" --read --write --key integrity-app-key
  echo "    bucket '$bucket' criado (privado, read+write para integrity-app-key)"
done

echo ""
echo "============================================================"
echo "Garage inicializado com sucesso!"
echo "Copie as credenciais (Key ID e Secret) acima para o .env:"
echo "  GARAGE_ACCESS_KEY=<Key ID>"
echo "  GARAGE_SECRET_KEY=<Secret key>"
echo "Depois: docker compose up -d --force-recreate backend"
echo "============================================================"
