#!/usr/bin/env bash

./stage1/intel.sh
wait

./stage2/judge.sh
wait

echo -e "doooooooooooooooooooooooooooooooone\n\n\n"

cat ./stage3/stage2.json