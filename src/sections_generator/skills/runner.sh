#!/usr/bin/env bash

set -e

SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="$SKILLS_DIR/../../resume_builder/sections/skills_section.json"
JD_PDF="$SKILLS_DIR/../../../company/JD.pdf"
JD_MD="$SKILLS_DIR/../../../company/JD.md"
STATIC_SKILLS_FILE="$SKILLS_DIR/static_skills.json"
PROMPT_FILE="$SKILLS_DIR/prompt.md"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: $PROMPT_FILE not found."
    exit 1
fi

BASE_PROMPT=$(cat "$PROMPT_FILE")

if [ -f "$JD_PDF" ]; then
    echo "Converting $JD_PDF to text..."
    pdftotext "$JD_PDF" "${JD_PDF}.txt"
    JD_CONTENT=$(cat "${JD_PDF}.txt")
elif [ -f "$JD_MD" ]; then
    echo "JD PDF not found. Using $JD_MD..."
    JD_CONTENT=$(cat "$JD_MD")
else
    echo "Error: No JD found."
    exit 1
fi

STATIC_SKILLS=$(cat "$STATIC_SKILLS_FILE")

FULL_PROMPT=$(cat <<PROMPT
$BASE_PROMPT

=== JOB DESCRIPTION ===
${JD_CONTENT}
=======================

=== CURRENT STATIC SKILLS ===
${STATIC_SKILLS}
=============================
PROMPT
)

echo "Running agy to update skills..."

agy \
    --model "gemini-3.1-pro" \
    --effort high \
    --dangerously-skip-permissions \
    --output-format json \
    -p "$FULL_PROMPT" \
    > "${OUTPUT_FILE}.tmp"

python3 -c '
import json, sys, re, os

try:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        content = f.read().strip()
        
    decoder = json.JSONDecoder()
    wrapper, idx = decoder.raw_decode(content)
    
    if isinstance(wrapper, dict) and "response" in wrapper:
        inner_content = wrapper["response"].strip()
    else:
        inner_content = content
        
    inner_content = re.sub(r"(?s)^```(?:json)?\n|\n```$", "", inner_content).strip()
    
    data = json.loads(inner_content)
    
    with open(sys.argv[2], "w", encoding="utf-8") as out:
        json.dump(data, out, indent=2)
        
    print(f"Successfully updated skills at {sys.argv[2]}")
    
except Exception as e:
    print(f"Error parsing JSON output: {e}")
    sys.exit(1)
' "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"

rm -f "${OUTPUT_FILE}.tmp"
if [ -f "${JD_PDF}.txt" ]; then
    rm -f "${JD_PDF}.txt"
fi

echo "Done generating missing skills."
