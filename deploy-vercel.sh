#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "Uso: $0 {unionlocal|papel}"
  exit 1
fi

TOKENS_FILE="${HOME}/.vercel-tokens"
if [[ ! -f "$TOKENS_FILE" ]]; then
  echo "No existe $TOKENS_FILE. Debe contener UNIONLOCAL_TOKEN=... y PAPEL_TOKEN=..."
  exit 1
fi
# shellcheck disable=SC1090
source "$TOKENS_FILE"

# ---------------- CONFIG (YA CON TUS IDS) ----------------
UNIONLOCAL_GIT_EMAIL="info@unionlocal.es"
UNIONLOCAL_ORG_ID="team_Xg6ET6ekr2qrh1KDggQtOHye"
UNIONLOCAL_PROJECT_ID="prj_Utr85O72mUGllagptHhhoJzIvBs1"

PAPEL_GIT_EMAIL="hola@papel.video"
PAPEL_ORG_ID="team_WYKptxs6IzXMOQp7iyVaNOuK"
PAPEL_PROJECT_ID="prj_1HmHHJokMOPgsIr1oAJcZOPmZ3hA"
# ---------------------------------------------------------

if [[ "$UNIONLOCAL_ORG_ID" == "$PAPEL_ORG_ID" && "$UNIONLOCAL_PROJECT_ID" == "$PAPEL_PROJECT_ID" ]]; then
  echo "⚠️  unionlocal y papel apuntan al mismo projectId/orgId (no parece tu caso ya)."
fi

cd "${REPO_DIR:-$(pwd)}"
[[ -f package.json ]] || { echo "No veo package.json en $(pwd)"; exit 1; }

case "$TARGET" in
  unionlocal)
    TOKEN="${UNIONLOCAL_TOKEN:-}"
    GIT_EMAIL="$UNIONLOCAL_GIT_EMAIL"
    ORG_ID="$UNIONLOCAL_ORG_ID"
    PROJECT_ID="$UNIONLOCAL_PROJECT_ID"
    ;;
  papel)
    TOKEN="${PAPEL_TOKEN:-}"
    GIT_EMAIL="$PAPEL_GIT_EMAIL"
    ORG_ID="$PAPEL_ORG_ID"
    PROJECT_ID="$PAPEL_PROJECT_ID"
    ;;
  *) echo "Target inválido: $TARGET"; exit 1 ;;
esac

[[ -n "$TOKEN" ]] || { echo "Falta el token para '$TARGET' en $TOKENS_FILE"; exit 1; }

# 1) Forzar link local por IDs (sin prompts)
mkdir -p .vercel
cat > .vercel/project.json <<JSON
{"orgId":"$ORG_ID","projectId":"$PROJECT_ID"}
JSON

# 2) Fijar identidad git local (evita el error de 'Git author must have access' si lo tenéis activo)
git config user.email "$GIT_EMAIL" >/dev/null
if ! git config user.name >/dev/null || [[ -z "$(git config user.name)" ]]; then
  git config user.name "Vercel Deploy" >/dev/null
fi

LAST_EMAIL="$(git log -1 --pretty=format:%ae 2>/dev/null || true)"
if [[ "${SKIP_GIT_AUTHOR_FIX:-0}" != "1" ]]; then
  if [[ -n "$LAST_EMAIL" && "$LAST_EMAIL" != "$GIT_EMAIL" ]]; then
    echo "Último commit author: $LAST_EMAIL -> creo commit vacío con $GIT_EMAIL"
    git commit --allow-empty -m "chore: deploy ($TARGET)" >/dev/null
    git push origin HEAD >/dev/null
  fi
fi

TEAM_FLAG=()
# orgId de team en Vercel empieza por team_
if [[ "$ORG_ID" == team_* ]]; then
  TEAM_FLAG=(--team "$ORG_ID")
fi

# 3) (Opcional) pull de env vars
if [[ "${PULL_ENV:-0}" == "1" ]]; then
  vercel pull --yes --environment=production --token "$TOKEN" "${TEAM_FLAG[@]}" >/dev/null || true
fi

# 4) Deploy prod
echo "Deploying '$TARGET' to Vercel (prod)..."
vercel --prod --yes --token "$TOKEN" "${TEAM_FLAG[@]}"
