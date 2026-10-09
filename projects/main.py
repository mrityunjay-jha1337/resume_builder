import os
import subprocess
import sys

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    bash_script_dir = os.path.join(script_dir, "script")
    
    # Change working directory so main.sh can find prompt.md and repos.txt
    os.chdir(bash_script_dir)
    
    print("Starting pipeline from main.sh...")
    try:
        subprocess.run(["bash", "main.sh"], check=True)
        print("Pipeline completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Pipeline failed with error code: {e.returncode}", file=sys.stderr)
        sys.exit(e.returncode)

if __name__ == "__main__":
    main()
