#!/usr/bin/env bash

echo "Welcome! This script installs and generates metadata about your projects..."

# Ensure required files exist
if [ ! -f "prompt.md" ]; then
    echo "Error: prompt.md not found!"
    exit 1
fi

if [ ! -f "repos.txt" ]; then
    echo "Error: repos.txt not found!"
    exit 1
fi

prompt=$(cat prompt.md)

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
            timeout 15m agy --dangerously-skip-permissions -p "$prompt"
            echo "AGY completed for $repo_name."
        ) &

        echo "AGY started in background for $repo_name"
    else
        echo "Something went wrong when trying to fetch $repo"
    fi

done < repos.txt

echo "All tasks started. Background processes are running."

echo "Waiting for all background processes to complete..."
wait
echo "All background processes have finished."

