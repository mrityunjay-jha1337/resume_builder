#!/usr/bin/bash

echo "Welcome! This script installs and generates metadata about your projects..."
prompt=$(cat prompt.md)

while IFS= read -r repo
do
    if [ -z "$repo" ]; then
        continue
    fi

    echo "Installing: $repo"

    if git clone "$repo"
    then
        echo "Installation successful for $repo"
        repo_name=$(basename "$repo" .git)

        # AGY ko background mein run karo
        (
            cd "$repo_name" || exit 1

            timeout 15m agy --dangerously-skip-permissions \
                "$prompt"
        ) > "${repo_name}_agy.log" 2>&1 &

        echo "AGY started for $repo_name"
    else
        echo "Something went wrong for $repo"
    fi

done < repos.txt

echo "All tasks started."
