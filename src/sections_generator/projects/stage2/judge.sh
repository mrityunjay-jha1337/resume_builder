#!/usr/bin/env bash
set -e
cd "$(dirname "$0")" || exit 1
# Adjusting paths relative to /mnt/c/Users/rajku/Desktop/resume/src/projects/stage2/
JD_FILE="./../../../../company/JD.pdf"
STAGE1_JSON="./stage1.json"
PROMPT_FILE="prompt.md"

if [ ! -f "$JD_FILE" ]; then
    echo "Error: $JD_FILE not found"
    exit 1
fi

if [ ! -f "$STAGE1_JSON" ]; then
    echo "Error: $STAGE1_JSON not found"
    exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: $PROMPT_FILE not found"
    exit 1
fi

echo "Reading inputs..."
# Parse PDF to text, fallback to empty string if it fails (e.g., if empty or invalid)
jd_content=$(pdftotext "$JD_FILE" - 2>/dev/null || echo "")
metadata_content=$(cat "$STAGE1_JSON")
prompt_content=$(cat "$PROMPT_FILE")

# Combine everything into a single prompt string
full_prompt=$(cat <<INPROMPT
$prompt_content

=== JOB DESCRIPTION ===
$jd_content
=======================

=== PROJECTS METADATA (JSON) ===
$metadata_content
=================================
INPROMPT
)

echo "Running agy to evaluate projects..."

agy \
    --model "gemini-3.1-pro" \
    --effort high \
    --dangerously-skip-permissions \
    --output-format json \
    -p "$full_prompt" \
    > raw_stage2.json

echo "Processing agy output..."

python3 -c '
import json, sys, re, os

try:
    with open("raw_stage2.json", "r", encoding="utf-8") as f:
        content = f.read().strip()
        
    decoder = json.JSONDecoder()
    wrapper, idx = decoder.raw_decode(content)
    
    # Extract inner response if agy wrapped it
    if "response" in wrapper:
        inner_content = wrapper["response"].strip()
    else:
        inner_content = content
        
    # Find the first { or [ and the last } or ]
    match = re.search(r"(\{.*\}|\[.*\])", inner_content, re.DOTALL)
    if match:
        inner_content = match.group(1)
        
    data = json.loads(inner_content)
    
    os.makedirs("../stage3", exist_ok=True)
    with open("../stage3/stage2.json", "w", encoding="utf-8") as out:
        json.dump(data, out, indent=2)
        
    print("Successfully extracted top projects to stage2.json!")
    
except Exception as e:
    print(f"Error parsing JSON output: {e}")
    sys.exit(1)
'

# Clean up raw output
rm -f raw_stage2.json
