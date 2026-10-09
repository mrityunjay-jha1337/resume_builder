#!/bin/bash
set -e

echo "Starting Resume Generation Pipeline"

# 1. Generate Metadata for Intern Projects
echo "--- Step 1: Processing Intern Projects ---"
if [ -d "intern/script" ]; then
    (cd intern/script && ./main.sh)
fi

# 2. Generate Metadata for Personal Projects
echo "--- Step 2: Processing Personal Projects ---"
if [ -d "projects/script" ]; then
    (cd projects/script && ./main.sh)
fi

# 3. Unify Metadata
echo "--- Step 3: Unifying Metadata ---"
python3 unify_metadata.py

# 4. Select Projects & Generate Bullets
echo "--- Step 4: Generating Bullets based on JD ---"
python3 generate_bullets.py

echo "Pipeline completed successfully!"
