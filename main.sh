#!/usr/bin/env bash

set -e
echo "started . . . "
bash /home/rajku/small_dih_big_dreams/resume_builder/src/sections_generator/projects/runner.sh

echo "sections generated now building resume. . ."
python3 /home/rajku/small_dih_big_dreams/resume_builder/src/resume_builder/build_resume.py Quadeye

wait 

echo "resume done now judging . . ."
bash /home/rajku/small_dih_big_dreams/resume_builder/src/resume_judge/judge.sh

wait 

echo "finished . . . "