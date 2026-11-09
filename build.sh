#!/usr/bin/env bash
# Monta dist/ com exatamente os arquivos que o site atual usa.
# Rode antes de publicar:  ./build.sh && npx wrangler pages deploy dist --project-name=agencia-krio
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir -p dist/assets "dist/assets 2"

# páginas e config
cp index.html styles.css main.js \
   404.html privacidade.html termos.html \
   robots.txt sitemap.xml llms.txt _headers \
   favicon.ico favicon.svg apple-touch-icon.png \
   dist/

# só os assets referenciados pelo index.html
cp assets/krio-logo-negativo.svg assets/krio-logo.svg assets/krio-icon.svg dist/assets/
cp "assets 2/estatua.png" "dist/assets 2/"

echo "dist/ montado:"
find dist -type f | sort
echo
echo "peso total: $(du -sh dist | cut -f1)"
