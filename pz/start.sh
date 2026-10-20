#!/bin/sh
# Brings up the pool calculation program (private repo ak-tarasov/pool-pz) next to the forms and runs it on 127.0.0.1:8766.
# Every deploy starts from an empty disk, so the code is cloned again and the data comes back from ak-tarasov/pool-pz-data.
# Keys: PZ_KEY_APP, PZ_KEY_SCHEME (read-only), PZ_KEY_DATA (read-write) — base64 of an ssh deploy key each.
set -e
[ -n "$PZ_KEY_APP" ] || { echo 'pz: no keys, calculation program is off'; exit 0; }
cd "$(dirname "$0")/.."
home="$PWD/.pz"
mkdir -p "$home/keys"
for k in APP SCHEME DATA; do
  eval "printf %s \"\$PZ_KEY_$k\"" | base64 -d > "$home/keys/$k"
  chmod 600 "$home/keys/$k"
done
git_as() { key=$1; shift; GIT_SSH_COMMAND="ssh -i $home/keys/$key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$home/keys/known_hosts" git "$@"; }
fetch() { # key repo dir
  if [ -d "$3/.git" ]; then git_as "$1" -C "$3" pull -q --ff-only; else git_as "$1" clone -q --depth 1 "git@github.com:ak-tarasov/$2.git" "$3"; fi
}
fetch APP pool-pz "$home/app"
fetch SCHEME hydroscheme "$home/hydroscheme"
if [ -d "$home/data/.git" ]; then git_as DATA -C "$home/data" pull -q --ff-only || true
else git_as DATA clone -q git@github.com:ak-tarasov/pool-pz-data.git "$home/data"; fi
git -C "$home/data" config user.name 'pool-pz server'
git -C "$home/data" config user.email 'a.tarasov@tibale.com'

[ -x "$home/venv/bin/python" ] || python3 -m venv "$home/venv"
req="$home/app/requirements.txt"
if ! cmp -s "$req" "$home/venv/requirements.txt"; then
  "$home/venv/bin/pip" install -q -r "$req" && cp "$req" "$home/venv/requirements.txt"
fi
cd "$home/app"
POOLPZ_DATA="$home/data/Объекты" POOLPZ_HYDROSCHEME="$home/hydroscheme" exec "$home/venv/bin/python" -m poolpz.server --no-browser --port 8766
