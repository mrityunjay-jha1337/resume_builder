import json
import sys
import markdown
from xhtml2pdf import pisa

if len(sys.argv) < 3:
    print("Usage: python visualizer.py <input.json> <output.pdf>")
    sys.exit(1)

input_json = sys.argv[1]
output_pdf = sys.argv[2]

try:
    print(f"Reading {input_json}...")
    with open(input_json, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # It could be a dict with "response", or the response itself
    if isinstance(data, dict) and "response" in data:
        response_text = data["response"]
    else:
        response_text = str(data)

    # Convert Markdown to HTML
    html_content = markdown.markdown(response_text)

    # We need to wrap it in basic HTML structure so xhtml2pdf handles it well
    html_str = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        @page {{ size: a4 portrait; margin: 2cm; }}
        body {{ font-family: Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }}
        h1 {{ color: #222; font-size: 20pt; padding-bottom: 10px; border-bottom: 1px solid #ccc; }}
        h2 {{ color: #333; font-size: 16pt; margin-top: 20px; }}
        h3 {{ color: #444; font-size: 14pt; margin-top: 15px; }}
        p {{ margin-bottom: 10px; }}
        code {{ background-color: #f4f4f4; padding: 2px 4px; font-family: monospace; font-size: 10pt; }}
        pre {{ background-color: #f4f4f4; padding: 10px; font-family: monospace; font-size: 10pt; white-space: pre-wrap; }}
        ul {{ margin-bottom: 10px; padding-left: 20px; }}
        li {{ margin-bottom: 5px; }}
    </style>
    </head>
    <body>
    {html_content}
    </body>
    </html>
    """

    print(f"Generating PDF at {output_pdf}...")
    with open(output_pdf, "wb") as result_file:
        # convert HTML to PDF
        pisa_status = pisa.CreatePDF(
                src=html_str,
                dest=result_file)

    if pisa_status.err:
        print("Error generating PDF", file=sys.stderr)
        sys.exit(1)
    else:
        print("PDF successfully generated.")

except Exception as e:
    print(f"Error during visualization: {e}", file=sys.stderr)
    sys.exit(1)
