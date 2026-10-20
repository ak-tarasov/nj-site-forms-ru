#!/bin/sh
# Saves what the program changed (objects, stamp, users, journal) to the private repo ak-tarasov/pool-pz-data.
data="$(dirname "$0")/../.pz/data"
[ -d "$data/.git" ] || exit 0
cd "$data"
[ -z "$(git status --porcelain)" ] && exit 0
git add -A
git commit -qm "Данные $(date -u +%F' '%H:%M) UTC"
home="$(cd .. && pwd)"
GIT_SSH_COMMAND="ssh -i $home/keys/DATA -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$home/keys/known_hosts" git push -q origin HEAD:main
