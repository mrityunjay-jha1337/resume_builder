#!/usr/bin/env bash

set -e

STAGE3_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGE2_JSON="$STAGE3_DIR/stage2.json"
PROMPT_FILE="$STAGE3_DIR/prompt.md"
OUTPUT_FILE="$./../../section/projects_section.json"

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed." >&2
    exit 1
fi

if [ ! -f "$STAGE2_JSON" ]; then
    echo "Error: $STAGE2_JSON not found." >&2
    exit 1
fi

# Load base prompt if it exists
BASE_PROMPT=""
if [ -f "$PROMPT_FILE" ]; then
    BASE_PROMPT=$(cat "$PROMPT_FILE")
fi

declare -a PIDS
declare -a RESULT_FILES

NUM_PROJECTS=$(jq '.topProjects | length' "$STAGE2_JSON")

for (( i=0; i<$NUM_PROJECTS; i++ )); do
    PROJECT_NAME=$(jq -r ".topProjects[$i].projectName" "$STAGE2_JSON")
    ABS_PATH=$(jq -r ".topProjects[$i].AbsolutePath" "$STAGE2_JSON")
    REPO_LINK=$(jq -r ".topProjects[$i].GithubRepoLink" "$STAGE2_JSON")

    echo "Starting job for: $PROJECT_NAME"

    # Construct the full prompt combining base prompt and project details
    FULL_PROMPT=$(cat <<EOF
$BASE_PROMPT

Project Details:
Name: $PROJECT_NAME
Repo Link: $REPO_LINK

Task: Generate a projects_section JSON object for this project based on its codebase.
EOF
)

    # Clean the project name to use it as a filename
    SAFE_PROJECT_NAME=$(echo "$PROJECT_NAME" | sed -r 's/[^a-zA-Z0-9]+/_/g')
    RESULT_FILE="$STAGE3_DIR/${SAFE_PROJECT_NAME}_projects_section.json"
    RESULT_FILES+=("$RESULT_FILE")

    # Run agy in the background
    (
        if ! cd "$ABS_PATH"; then
            echo "Failed to cd into $ABS_PATH" >&2
            exit 1
        fi

        echo "Running agy in $ABS_PATH..."
        agy \
            --model "gemini-3.1-pro" \
            --effort high \
            --dangerously-skip-permissions \
            --output-format json \
            -p "$FULL_PROMPT" \
            > "$RESULT_FILE"
            
        echo "Finished $PROJECT_NAME"
    ) &
    
    # Store the PID of the background process
    PIDS+=($!)
done

echo "Waiting for ${#PIDS[@]} background jobs to finish..."
for pid in "${PIDS[@]}"; do
    wait "$pid"
done
echo "All background jobs completed."

# Combine all individual JSON files into a single array
if [ ${#RESULT_FILES[@]} -gt 0 ]; then
    # Create an empty array file first
    echo "[]" > "$OUTPUT_FILE"
    
    for file in "${RESULT_FILES[@]}"; do
        if [ -f "$file" ]; then
            # Extract the response, remove markdown formatting, and append to the output file
            jq -r '.response | sub("^```json\\n";"") | sub("\\n```\\n?$";"")' "$file" > "${file}.tmp"
            jq -s '.[0] + [.[1]]' "$OUTPUT_FILE" "${file}.tmp" > "${OUTPUT_FILE}.tmp"
            mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"
            rm "${file}.tmp"
            
            # Remove the residual individual project result file
            rm "$file"
        fi
    done
    echo "Combined results saved to $OUTPUT_FILE"
else
    echo "No results were generated." >&2
fi