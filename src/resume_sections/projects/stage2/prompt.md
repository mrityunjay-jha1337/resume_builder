/goal 

Act as an expert technical recruiter and software engineering evaluator. Your task is to carefully read the provided Job Description (JD) and the accompanying JSON file containing a portfolio of projects. You must evaluate all projects and select the **top two** projects that best demonstrate the skills, tech stack, and experience required by the JD.

**Evaluation Criteria:**

1. **Tech Stack Match:** How well do the project's languages, frameworks, and tools align with the JD requirements?
2. **Relevance & Complexity:** Does the project solve problems at a scale or domain relevant to the employer?
3. **Standout Features:** Do the strong points and architecture of the project prove the candidate's capability for the role?

**Output Format Requirement:**
Your final output MUST be pure, valid JSON returned directly. Do not create any files. The output MUST contain pure, valid JSON with no markdown formatting blocks (like ```json), no conversational text, and no extra characters.

**Required JSON Structure:**

```json
{
  "topProjects": [
    {
      "projectName": "Name of the first selected project",
      "AbsolutePath":"the absolute path of the root of the project",
  	  "GithubRepoLink":"github link of the project",
      "matchJustification": "A strong, brief technical justification explaining exactly why this project is a top fit for the JD requirements."
    },
    {
      "projectName": "Name of the second selected project",
      "AbsolutePath":"...",
  	  "GithubRepoLink":"..."
      "matchJustification": "..."
    }
  ]
}
```

**Execution Instructions:**

1. Read the provided JD and the JSON array of projects.
2. Analyze and rank the projects based on the criteria above.
3. Select exactly the top two matching projects.
4. Output the result strictly in the requested JSON format.
