#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
echo "Welcome! This script installs and generates metadata about all of your projects in a json and then unify them..."

# Ensure required files exist
if [ ! -f "metadata_prompt.md" ]; then
    echo "Error: metadata_prompt.md not found!"
    exit 1
fi

if [ ! -f "repos.txt" ]; then
    echo "Error: repos.txt not found!"
    exit 1
fi

prompt=$(cat metadata_prompt.md)

# Read repos.txt (|| [ -n "$repo" ] ensures the last line is read even if missing a newline)
while IFS= read -r repo || [ -n "$repo" ]; do
    # Strip carriage returns and trim whitespace
    repo=$(echo "$repo" | tr -d '\r' | xargs)

    if [ -z "$repo" ]; then
        continue
    fi

    echo "Processing: $repo"
    
    # Extract repo name from URL
    repo_name=$(basename "$repo" .git)

    # Check if directory already exists in projects_list
    if [ -d "projects_list/$repo_name" ]; then
        echo "Directory $repo_name already exists. Pulling latest changes..."
        (cd "projects_list/$repo_name" && git pull)
        clone_status=0
    else
        echo "Installing: $repo"
        mkdir -p projects_list
        git clone "$repo" "projects_list/$repo_name"
        clone_status=0
    fi

    if [ $clone_status -eq 0 ]; then
        echo "Installation/Update successful for $repo_name"

        # AGY ko background mein run karo
        (
            cd "projects_list/$repo_name" || exit 1
            echo "Starting AGY for $repo_name..."
            timeout 15m agy \
            --model "gemini-3.1-pro" \
            --effort high \
            --dangerously-skip-permissions \
            --output-format json \
            -p "$prompt" \
            > "repository_metadata.json"
            echo "AGY completed for $repo_name."
        ) &

        echo "AGY started in background for $repo_name"
    else
        echo "Something went wrong when trying to fetch $repo"
    fi

done < repos.txt

echo "All tasks started. Background processes are running.Waiting for all background processes to complete..."

wait

echo "All background processes have finished.now unifying them..."
OUTPUT_FILE="./../stage2/stage1.json"

echo "Combining metadata files using Python for robustness..."

python3 -c '
import os, json, glob, re

output_file = "'"$OUTPUT_FILE"'"
metadata_files = glob.glob("projects_list/*/repository_metadata.json")

if not metadata_files:
    print("No metadata files found. Creating an empty JSON array.")
    with open(output_file, "w") as f:
        json.dump([], f)
    exit(0)

combined_data = []
for file_path in metadata_files:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            
        decoder = json.JSONDecoder()
        obj, idx = decoder.raw_decode(content)
        
        if "response" in obj:
            response_str = obj.get("response")
            start = response_str.find("{")
            end = response_str.rfind("}")
            if start != -1 and end != -1:
                clean_str = response_str[start:end+1]
                data = json.loads(clean_str)
            else:
                print(f"Could not find valid JSON in response string for {file_path}")
                continue
        else:
            data = obj
            
        repo_dir = os.path.basename(os.path.dirname(file_path))
        data["localLocation"] = os.path.abspath(os.path.dirname(file_path))
        
        data["repoLink"] = ""
        if os.path.exists("repos.txt"):
            with open("repos.txt", "r") as rfile:
                for line in rfile:
                    line = line.strip()
                    if line.endswith("/" + repo_dir) or line.endswith("/" + repo_dir + ".git"):
                        data["repoLink"] = line
                        break
                        
        combined_data.append(data)
        print(f"Successfully loaded {file_path}")
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(combined_data, f, indent=2)

print(f"Successfully combined {len(combined_data)} metadata files into {output_file}")
'
