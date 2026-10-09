#!/usr/bin/env bash

set -u

# Read job description and prompt template
job_description="$(pdftotext -layout /resume/company/JD.pdf -)"
prompt_template="$(cat prompt.md)"

# Process each project repository
for repo in "$@"; do
    if [[ ! -d "$repo" ]]; then
        echo "Skipping invalid repo: $repo" >&2
        continue
    fi

    repo="$(realpath "$repo")"
    project_name="$(basename "$repo")"

    (
        cd "$repo" || exit 1

        prompt="$prompt_template
        Job Description:
        $job_description

        Project Name: $project_name
        Project Repository: $repo

        TASK:
        Analyze this repository and generate resume bullet points tailored
        to the job description.

        Requirements:
        1. Understand the actual project by examining its source code,architecture, features, and technologies.
        2. Generate 4 concise, impactful resume bullet points.
        3. Highlight relevant technical skills, engineering decisions,complexity, and measurable impact where supported by evidence.
        4. Never invent metrics, users, performance improvements, or features.
        5. Use strong action verbs and professional resume language.
        6. Prioritize relevance to the given job description.
        7. Do not modify any project files.
        8. Use STAR method strictly to generate bullets  
        9. Return valid JSON only, following this structure:

        {
          \"project_name\": \"$project_name\",
          \"Github_link\": \"$repo\",
          \"technologies\": [],
          \"bullets\": [
            {
              \"text\": \"Resume bullet point\",
              \"evidence\": \"Code, file, or implementation supporting this claim\",
              \"jd_relevance\": \"Why this bullet is relevant to the job\"
            }
          ]
        }"

        agy \
            --model "gemini-3.1-pro" \
            --effort high \
            --dangerously-skip-permissions \
            --output-format json \
            -p "$prompt" \
            > "$repo/agy-bullets.json" 

        echo "Finished: $project_name"
    ) &

    echo "Started agy for $project_name"
done

wait

echo "All bullets made."

# now we need to create a single unified json for all bullets
projects_section="/resume/resume_section/projects_section.json"

jq -s '{
    projects: .
}' $(for repo in "$@"; do
    if [[ -f "$repo/agy-bullets.json" ]]; then
        printf '%s\n' "$repo/agy-bullets.json"
    fi
done) > "$projects_section"

echo "Unified JSON saved to: $projects_section"
