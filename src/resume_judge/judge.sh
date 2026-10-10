#! /usr/bin/env bash

set -e

CURR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$CURR_DIR/../resume_builder/output"
JUDGE_JSON="$OUTPUT_DIR/judge.json"
PDF_RESULT="$OUTPUT_DIR/judge_result.pdf"

FILE="$OUTPUT_DIR/resume.pdf"
Resume=$(pdftotext "$FILE" - 2>/dev/null || echo "")

# Note: Changed to JD.pdf as it is likely meant to be the job description
JD_FILE="$CURR_DIR/../../company/JD.pdf"
jd_File=$(pdftotext "$JD_FILE" - 2>/dev/null || echo "")

# Ensure we use an absolute path for prompt.md
PROMPT_FILE="$CURR_DIR/prompt.md"
prompt_text=$(cat "$PROMPT_FILE" 2>/dev/null || echo "")

# Use a Here-Document to combine the texts safely
prompt=$(cat <<EOF
$prompt_text

=== JOB DESCRIPTION ===
$jd_File

=== RESUME ===
$Resume
EOF
)

# Delete old judge.json and pdf if they exist
echo "Removing old judge.json and pdf if present..."
rm -f "$JUDGE_JSON"
rm -f "$PDF_RESULT"

echo "started judging . . ."

# Run agy and save to a temporary JSON
TMP_JSON="$CURR_DIR/tmp_result.json"

timeout 15m agy \
  --model "gemini-3.1-pro" \
  --effort high \
  --dangerously-skip-permissions \
  --output-format json \
  -p "$prompt" \
  > "$TMP_JSON"

echo "result given . . ."

# Extract only the response using jq and save to judge.json
echo "Extracting response to judge.json..."
jq '{response: .response}' "$TMP_JSON" > "$JUDGE_JSON"
rm -f "$TMP_JSON"

# Generate beautiful PDF using python visualizer script
echo "Running Python visualizer..."
"$CURR_DIR/venv/bin/python" "$CURR_DIR/visualizer.py" "$JUDGE_JSON" "$PDF_RESULT"

echo "All done! Outputs are in $OUTPUT_DIR"
