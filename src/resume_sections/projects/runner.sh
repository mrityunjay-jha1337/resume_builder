#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1

(cd stage1 && ./intel.sh)
wait

(cd stage2 && ./judge.sh)
wait

(cd stage3 && ./knowledge.sh)
wait

echo -e "done"

