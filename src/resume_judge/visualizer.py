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

    # Sanitize characters unsupported by standard PDF fonts
    char_replacements = {
        '█': '#', '░': '-', '▌': '|', '■': '*', '□': '*',
        '✔': '[x]', '❌': '[ ]', '●': '*', '○': '*'
    }
    for k, v in char_replacements.items():
        response_text = response_text.replace(k, v)

    # Convert Markdown to HTML with table and code extensions
    html_content = markdown.markdown(response_text, extensions=['tables', 'fenced_code'])

    # We need to wrap it in basic HTML structure so xhtml2pdf handles it well
    html_str = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        @page {{ size: a4 portrait; margin: 1.5cm; }}
        body {{ font-family: Helvetica, Arial, sans-serif; font-size: 10pt; line-height: 1.45; color: #333; }}
        h1 {{ color: #222; font-size: 18pt; padding-bottom: 8px; border-bottom: 1px solid #ccc; }}
        h2 {{ color: #333; font-size: 14pt; margin-top: 18px; border-bottom: 0.5px solid #eee; }}
        h3 {{ color: #444; font-size: 12pt; margin-top: 14px; }}
        h4 {{ color: #555; font-size: 10.5pt; margin-top: 10px; }}
        p {{ margin-bottom: 8px; }}
        code {{ background-color: #f4f4f4; padding: 2px 4px; font-family: monospace; font-size: 8.5pt; }}
        pre {{ background-color: #f4f4f4; padding: 8px; font-family: monospace; font-size: 8pt; white-space: pre-wrap; }}
        ul {{ margin-bottom: 8px; padding-left: 20px; }}
        li {{ margin-bottom: 4px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }}
        th, td {{ border: 1px solid #ccc; padding: 5px 7px; font-size: 8.5pt; text-align: left; vertical-align: top; }}
        th {{ background-color: #f0f0f0; font-weight: bold; }}
        hr {{ border: 0; border-top: 1px solid #ddd; margin: 15px 0; }}
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
