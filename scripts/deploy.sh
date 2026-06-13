#!/usr/bin/env sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

TARGET=${1:-all}
if [ "$#" -gt 0 ]; then
  shift
fi

case "$TARGET" in
  all)
    exec npm run deploy -- "$@"
    ;;
  functions)
    exec npm run deploy:functions -- "$@"
    ;;
  hosting)
    exec npm run deploy:hosting -- "$@"
    ;;
  *)
    printf 'Unbekanntes Deploy-Ziel: %s\n' "$TARGET" >&2
    printf 'Verwendung: %s [all|hosting|functions] [Firebase-Optionen]\n' "$0" >&2
    exit 2
    ;;
esac
