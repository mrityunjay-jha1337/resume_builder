#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1

(cd stage1 && ./intel.sh)
wait

(cd stage2 && ./judge.sh)
wait

echo -e "dooooooooooooooooooooooooooooone\n\n\n"

cat ./stage3/stage2.json