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
rm -f "$CURR_DIR"/tmp_result*.json

echo "started judging . . ."

# Run agy and save to a unique temporary JSON
TMP_JSON=$(mktemp "${CURR_DIR}/tmp_result_XXXXXX.json")
trap 'rm -f "${TMP_JSON}"' EXIT

timeout 15m agy \
  --model "gemini-3.1-pro" \
  --effort high \
  --dangerously-skip-permissions \
  --disable-slash-commands \
  --output-format json \
  -p "$prompt" \
  > "$TMP_JSON"

echo "result given . . ."

# Extract response safely and save to judge.json
echo "Extracting response to judge.json..."
python3 -c '
import json, sys, re, os

tmp_file = sys.argv[1]
out_file = sys.argv[2]

try:
    with open(tmp_file, "r", encoding="utf-8", errors="replace") as f:
        content = f.read().strip()

    if not content:
        raise ValueError("Temporary output file is empty")

    response_text = ""
    # Try decoding JSON directly
    try:
        data = json.loads(content)
        if isinstance(data, dict):
            response_text = data.get("response", "")
        elif isinstance(data, str):
            response_text = data
    except Exception:
        # Try raw_decode for multi-object / leading JSON
        try:
            decoder = json.JSONDecoder()
            wrapper, _ = decoder.raw_decode(content)
            if isinstance(wrapper, dict) and "response" in wrapper:
                response_text = wrapper["response"]
        except Exception:
            # Fallback regex search for "response" field
            match = re.search(r"\"response\"\s*:\s*\"(.*?)(?<!\\)\"", content, re.DOTALL)
            if match:
                response_text = json.loads(f"\"{match.group(1)}\"")
            else:
                response_text = content

    # Check if response_text is a pointer to an external brain artifact
    if response_text and len(response_text) < 1500:
        file_match = re.search(r"\(file://(/home/rajku/[^\)]+\.md)\)", response_text)
        if file_match:
            ref_path = file_match.group(1)
            if os.path.exists(ref_path):
                print(f"Loading full content from referenced file: {ref_path}")
                with open(ref_path, "r", encoding="utf-8", errors="replace") as rf:
                    response_text = rf.read()

    if not response_text:
        raise ValueError("Could not extract non-empty response")

    with open(out_file, "w", encoding="utf-8") as out:
        json.dump({"response": response_text}, out, indent=2, ensure_ascii=False)

    print("Successfully saved response to", out_file)
except Exception as e:
    print(f"Error extracting response: {e}", file=sys.stderr)
    sys.exit(1)
' "$TMP_JSON" "$JUDGE_JSON"

# Generate beautiful PDF using python visualizer script
echo "Running Python visualizer..."
"$CURR_DIR/venv/bin/python" "$CURR_DIR/visualizer.py" "$JUDGE_JSON" "$PDF_RESULT"

echo "All done! Outputs are in $OUTPUT_DIR"
