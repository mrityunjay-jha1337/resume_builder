#!/usr/bin/env bash

OUTPUT_FILE="../../unified_metadata.json"
echo "Combining metadata files using Python for robustness..."

python3 -c '
import os, json, glob, re

output_file = "'"$OUTPUT_FILE"'"
metadata_files = glob.glob("*/repository_metadata.json")

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
            # Strip markdown formatting if present
            content = re.sub(r"^```json\s*", "", content, flags=re.IGNORECASE)
            content = re.sub(r"\s*```$", "", content)
            
            data = json.loads(content)
            
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
