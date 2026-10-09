import os
import json
import glob
import re

def process_metadata(base_dir, project_type):
    metadata_files = glob.glob(f"{base_dir}/script/projects_list/*/repository_metadata.json")
    
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
                data["type"] = project_type
                
                data["repoLink"] = ""
                repos_file = f"{base_dir}/script/repos.txt"
                if os.path.exists(repos_file):
                    with open(repos_file, "r") as rfile:
                        for line in rfile:
                            line = line.strip()
                            if line.endswith("/" + repo_dir) or line.endswith("/" + repo_dir + ".git"):
                                data["repoLink"] = line
                                break
                                
                combined_data.append(data)
                print(f"Successfully loaded {file_path} as {project_type}")
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            
    return combined_data

def main():
    intern_data = process_metadata("intern", "intern")
    personal_data = process_metadata("projects", "personal")
    
    all_data = intern_data + personal_data
    
    output_file = "unified_metadata.json"
    
    if not all_data:
        print("No metadata files found. Creating an empty JSON array.")
        with open(output_file, "w") as f:
            json.dump([], f)
        return
        
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=2)
        
    print(f"Successfully combined {len(all_data)} metadata files into {output_file}")

if __name__ == "__main__":
    main()
