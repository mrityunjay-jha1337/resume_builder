Analyze the provided project details and its repository to create a JSON object for a resume's "Projects" section.

The JSON should strictly follow this structure:
{
  "title": "PROJECT NAME IN ALL CAPS",
  "technologies": "Comma, separated, string, of, technologies",
  "github_link": "URL to repository",
  "bullets": [
    "First bullet explains what the project is in simple technical terms, highlighting key features with \\textbf{bold} text.",
    "Implemented \\textbf{feature X} using \\textbf{tech Y} resulting in Z."
  ]
}

Focus on highlighting technical achievements, architectural decisions, and impact. Keep bullet points concise and action-oriented. The bullets should be made using the STAR method, avoid jargon, and use LaTeX `\\textbf{text}` to bold key terms and technologies. Ensure the first bullet explains in easy technical words about what the project is.
