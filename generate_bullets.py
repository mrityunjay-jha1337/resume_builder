import os
import json
import subprocess
import sys
import re

def run_agy(prompt, cwd=None):
    cmd = ["agy", "--dangerously-skip-permissions", "--print", prompt]
    try:
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running agy: {e.stderr}", file=sys.stderr)
        return None

def extract_json(text):
    # Try to extract JSON from markdown block
    match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if match:
        text = match.group(1)
    else:
        # Sometimes it might use just ``` without json
        match = re.search(r"```\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            text = match.group(1)
            
    # Try to clean up text to find JSON boundaries if no markdown was used
    start = text.find('[')
    end = text.rfind(']') + 1
    if start != -1 and end != 0:
        text = text[start:end]
        
    try:
        return json.loads(text)
    except:
        # fallback
        # just find first [ and last ]
        if start != -1 and end != -1:
             return json.loads(text[start:end])
        return []

def select_projects(jd, metadata, project_type, limit=2):
    if not metadata:
        return []
        
    selection_prompt = f"""
    You are an expert technical recruiter. Given the following Job Description (JD) and a list of {project_type} project metadata, select the most relevant projects for this role.
    
    Job Description:
    {jd}
    
    Projects Metadata:
    {json.dumps(metadata, indent=2)}
    
    Output ONLY a JSON list of the 'localLocation' strings for the selected {project_type} projects. Limit to top {limit} projects.
    For example:
    [
      "/mnt/c/Users/rajku/Desktop/resume/projects/script/projects_list/Alaska"
    ]
    Do not include any other text or markdown block, just the JSON array.
    """
    
    print(f"Selecting best {project_type} projects based on JD...")
    selection_output = run_agy(selection_prompt)
    if not selection_output:
        print(f"Failed to get {project_type} project selection from AGY.")
        return []
        
    try:
        selected_locations = extract_json(selection_output)
    except Exception as e:
        print(f"Could not parse selection output as JSON for {project_type}. Output was:\n{selection_output}")
        return []
        
    if not isinstance(selected_locations, list):
        print(f"Expected a JSON list, but got: {type(selected_locations)}")
        return []
        
    return selected_locations

def generate_bullets_for_locations(locations, jd, root_dir):
    final_bullets = {}
    for loc in locations:
        if not os.path.isabs(loc):
            loc = os.path.abspath(os.path.join(root_dir, loc))
            
        if not os.path.isdir(loc):
            print(f"Warning: Directory not found: {loc}. Skipping.")
            continue
            
        proj_name = os.path.basename(loc)
        print(f"Generating STAR bullets for {proj_name}...")
        
        bullet_prompt = f"""
        You are an expert resume writer. Given the following Job Description:
        {jd}
        
        Analyze this repository's codebase and generate 3 to 5 powerful resume bullet points for this project using the STAR (Situation, Task, Action, Result) method. Ensure the bullets highlight skills and technologies relevant to the JD.
        
        Output ONLY a JSON array of strings, where each string is a single bullet point.
        Example:
        [
          "Developed a scalable microservice using Node.js to solve...",
          "Optimized database queries resulting in..."
        ]
        Do not include any other text or markdown block, just the JSON array.
        """
        
        bullet_output = run_agy(bullet_prompt, cwd=loc)
        if bullet_output:
            try:
                bullets = extract_json(bullet_output)
                if isinstance(bullets, list):
                    final_bullets[proj_name] = bullets
                else:
                    print(f"Warning: Expected list of bullets for {proj_name}, got {type(bullets)}")
            except Exception as e:
                print(f"Could not parse bullets for {proj_name}. Output was:\n{bullet_output}")
    return final_bullets

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    metadata_path = os.path.join(root_dir, "unified_metadata.json")
    jd_path = os.path.join(root_dir, "company", "JD.md")
    
    if not os.path.exists(metadata_path):
        print(f"Error: {metadata_path} not found.")
        print("Please run the first pipeline (unify_metadata.py) to generate the metadata.")
        return
        
    if not os.path.exists(jd_path):
        print(f"Error: {jd_path} not found.")
        print("Creating an empty JD.md file. Please populate it with a job description.")
        os.makedirs(os.path.dirname(jd_path), exist_ok=True)
        with open(jd_path, "w") as f:
            f.write("")
        return
        
    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)
        
    with open(jd_path, "r", encoding="utf-8") as f:
        jd = f.read().strip()
        
    if not jd:
        print("Warning: JD is empty. Please populate company/JD.md with a job description for better results.")
        jd = "Software Engineer role (generic)"
        
    # Split metadata by type
    intern_metadata = [m for m in metadata if m.get("type") == "intern"]
    personal_metadata = [m for m in metadata if m.get("type") == "personal"]
    
    intern_locs = select_projects(jd, intern_metadata, "intern", limit=2)
    personal_locs = select_projects(jd, personal_metadata, "personal", limit=2)
    
    print(f"Selected intern projects: {intern_locs}")
    print(f"Selected personal projects: {personal_locs}")
    
    final_bullets = {
        "intern": generate_bullets_for_locations(intern_locs, jd, root_dir),
        "personal": generate_bullets_for_locations(personal_locs, jd, root_dir)
    }
    
    output_json_path = os.path.join(root_dir, "company", "star_bullets.json")
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(final_bullets, f, indent=2)
        
    print(f"Finished! Bullets saved to {output_json_path}")

if __name__ == "__main__":
    main()
