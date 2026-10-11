#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1

(cd stage1 && chmod +x ./intel.sh && ./intel.sh)
wait

(cd stage2 && chmod +x ./judge.sh && ./judge.sh)
wait

(cd stage3 && chmod +x ./knowledge.sh &&  ./knowledge.sh)
wait

echo -e "done"

