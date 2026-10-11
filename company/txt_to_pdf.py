#!/usr/bin/env python3
"""
txt_to_pdf.py - Convert plain text (.txt) files into clean, professional PDF documents.

Usage:
    python3 txt_to_pdf.py <input_file.txt> [output_file.pdf] [options]
    ./txt_to_pdf.py <input_file.txt> [output_file.pdf] [options]

Examples:
    python3 company/txt_to_pdf.py notes.txt
    python3 company/txt_to_pdf.py JD.txt JD.pdf
    python3 company/txt_to_pdf.py code.txt --font mono --font-size 9
"""

import os
import sys
import argparse
import html
import re
from pathlib import Path

# ReportLab imports
try:
    from reportlab.lib import pagesizes
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
except ImportError:
    print("Error: 'reportlab' is required. Please install it using: pip install reportlab", file=sys.stderr)
    sys.exit(1)


# Register available Unicode TrueType fonts (DejaVu Sans / Mono / Serif)
def setup_fonts():
    """Register DejaVu or Liberation fonts if available for full Unicode support."""
    font_candidates = {
        'DejaVuSans': {
            'regular': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            'bold': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            'italic': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf',
            'boldItalic': '/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf'
        },
        'DejaVuSansMono': {
            'regular': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
            'bold': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
            'italic': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Oblique.ttf',
            'boldItalic': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-BoldOblique.ttf'
        },
        'DejaVuSerif': {
            'regular': '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
            'bold': '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
            'italic': '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf',
            'boldItalic': '/usr/share/fonts/truetype/dejavu/DejaVuSerif-BoldItalic.ttf'
        }
    }

    registered = {}
    for family, files in font_candidates.items():
        if os.path.exists(files['regular']):
            try:
                pdfmetrics.registerFont(TTFont(family, files['regular']))
                reg_kwargs = {'normal': family}
                
                if os.path.exists(files['bold']):
                    bold_name = f"{family}-Bold"
                    pdfmetrics.registerFont(TTFont(bold_name, files['bold']))
                    reg_kwargs['bold'] = bold_name
                    
                if os.path.exists(files['italic']):
                    italic_name = f"{family}-Italic"
                    pdfmetrics.registerFont(TTFont(italic_name, files['italic']))
                    reg_kwargs['italic'] = italic_name
                    
                if os.path.exists(files['boldItalic']):
                    bi_name = f"{family}-BoldItalic"
                    pdfmetrics.registerFont(TTFont(bi_name, files['boldItalic']))
                    reg_kwargs['boldItalic'] = bi_name

                pdfmetrics.registerFontFamily(family, **reg_kwargs)
                registered[family] = True
            except Exception:
                pass

    return registered


REGISTERED_FONTS = setup_fonts()


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that counts total pages and draws page numbers
    and optional header on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.show_footer = getattr(self, 'show_footer', True)
        self.header_text = getattr(self, 'header_text', None)

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw_decorations(self, num_pages):
        self.saveState()
        page_width, page_height = self._pagesize

        # Running header (if enabled)
        if self.header_text:
            self.setFont("Helvetica", 8)
            self.setFillColorRGB(0.5, 0.5, 0.5)
            self.drawString(54, page_height - 36, str(self.header_text))
            self.setStrokeColorRGB(0.85, 0.85, 0.85)
            self.setLineWidth(0.5)
            self.line(54, page_height - 42, page_width - 54, page_height - 42)

        # Running footer with page count
        if self.show_footer:
            self.setFont("Helvetica", 8.5)
            self.setFillColorRGB(0.45, 0.45, 0.45)
            page_str = f"Page {self._pageNumber} of {num_pages}"
            self.drawRightString(page_width - 54, 34, page_str)
            self.setStrokeColorRGB(0.88, 0.88, 0.88)
            self.setLineWidth(0.5)
            self.line(54, 46, page_width - 54, 46)

        self.restoreState()


def make_canvas_factory(show_footer=True, header_text=None):
    """Factory to inject options into NumberedCanvas."""
    class CustomNumberedCanvas(NumberedCanvas):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.show_footer = show_footer
            self.header_text = header_text
    return CustomNumberedCanvas


def resolve_font_name(font_choice):
    """Resolve font name to best available registered TTF font or fallback to standard PDF font."""
    font_choice = font_choice.lower()
    if font_choice in ['mono', 'monospace', 'courier', 'code']:
        return 'DejaVuSansMono' if 'DejaVuSansMono' in REGISTERED_FONTS else 'Courier'
    elif font_choice in ['serif', 'times', 'times-roman']:
        return 'DejaVuSerif' if 'DejaVuSerif' in REGISTERED_FONTS else 'Times-Roman'
    elif font_choice in ['sans', 'sans-serif', 'helvetica', 'arial']:
        return 'DejaVuSans' if 'DejaVuSans' in REGISTERED_FONTS else 'Helvetica'
    else:
        # User specified an exact font name
        return font_choice


def format_text_line(raw_line):
    """
    Safely format a single line of text for ReportLab Paragraph:
    - Expand tabs to 4 spaces
    - Escape XML/HTML special characters (<, >, &)
    - Preserve leading indentation as &nbsp;
    - Preserve multi-space sequences as &nbsp; for column/table alignment
    - Preserve single spaces as normal spaces so word wrapping works properly
    """
    expanded = raw_line.expandtabs(4)
    escaped = html.escape(expanded, quote=False)
    
    # Calculate leading spaces to preserve exact indentation
    stripped = escaped.lstrip(' ')
    leading_count = len(escaped) - len(stripped)
    leading_nbsp = '&nbsp;' * leading_count
    
    # Replace internal sequences of 2+ spaces with &nbsp; to preserve column formatting
    def replace_multiple_spaces(match):
        return '&nbsp;' * len(match.group(0))
    
    formatted_body = re.sub(r' {2,}', replace_multiple_spaces, stripped)
    return leading_nbsp + formatted_body


def read_text_file(filepath, encoding=None):
    """Read file with specified encoding or automatic fallback to avoid decoding crashes."""
    encodings_to_try = [encoding] if encoding else ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'utf-16']
    
    for enc in encodings_to_try:
        if not enc:
            continue
        try:
            with open(filepath, 'r', encoding=enc) as f:
                return f.read()
        except (UnicodeDecodeError, LookupError):
            continue

    # Fallback with error replacement
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()


def convert_txt_to_pdf(input_path, output_path=None, **options):
    """
    Convert a text file to a PDF file.

    Parameters:
        input_path (str): Path to the input text file.
        output_path (str, optional): Path for the output PDF. If None, uses input_path with .pdf extension.
        **options:
            page_size (str): 'a4', 'letter', 'legal', etc. Default: 'a4'.
            orientation (str): 'portrait' or 'landscape'. Default: 'portrait'.
            font (str): 'sans', 'mono', 'serif', or specific font name. Default: 'sans'.
            font_size (float): Font size in pt. Default: 10.0.
            line_spacing (float): Line height/leading in pt. Default: font_size * 1.35.
            margin (float): Margin in pt. Default: 54.0 (0.75 inch).
            show_footer (bool): Whether to show page numbers. Default: True.
            header_text (str): Header text. Default: None.
            encoding (str): Text encoding. Default: None (auto-detect).
    
    Returns:
        str: Absolute path of the generated PDF file.
    """
    input_file = Path(input_path).resolve()
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    if not input_file.is_file():
        raise ValueError(f"Input path is not a file: {input_path}")

   
    out_file="./"

    # Page size and orientation
    page_size_name = options.get('page_size', 'a4').lower()
    page_size_dict = {
        'a4': pagesizes.A4,
        'letter': pagesizes.LETTER,
        'legal': pagesizes.LEGAL,
        'a3': pagesizes.A3,
        'a5': pagesizes.A5,
    }
    base_page_size = page_size_dict.get(page_size_name, pagesizes.A4)
    orientation = options.get('orientation', 'portrait').lower()
    if orientation == 'landscape':
        page_size = pagesizes.landscape(base_page_size)
    else:
        page_size = pagesizes.portrait(base_page_size)

    # Margins and styles
    margin = float(options.get('margin', 54.0))  # 54 pt = 0.75 in
    font_size = float(options.get('font_size', 10.0))
    line_spacing = float(options.get('line_spacing', font_size * 1.35))
    font_choice = options.get('font', 'sans')
    font_name = resolve_font_name(font_choice)

    style = ParagraphStyle(
        'TxtToPdfBody',
        fontName=font_name,
        fontSize=font_size,
        leading=line_spacing,
        spaceBefore=0,
        spaceAfter=0,
        textColor='#1a1a1a'
    )

    # Read text
    text_content = read_text_file(input_file, encoding=options.get('encoding'))
    raw_lines = text_content.splitlines()

    # Build document flowables
    story = []
    spacer_height = max(line_spacing * 0.6, 5)

    if not raw_lines:
        # Handle empty file gracefully
        story.append(Paragraph("&nbsp;", style))
    else:
        for line in raw_lines:
            if not line.strip():
                story.append(Spacer(1, spacer_height))
            else:
                formatted_line = format_text_line(line)
                story.append(Paragraph(formatted_line, style))

    # Canvas setup with header and page numbering
    show_footer = options.get('show_footer', True)
    header_text = options.get('header_text', None)
    canvas_cls = make_canvas_factory(show_footer=show_footer, header_text=header_text)

    # Build PDF
    top_margin = margin if not header_text else margin + 10
    bottom_margin = margin if not show_footer else margin + 10

    doc = SimpleDocTemplate(
        str(out_file),
        pagesize=page_size,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=top_margin,
        bottomMargin=bottom_margin
    )

    doc.build(story, canvasmaker=canvas_cls)
    return str(out_file)


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Convert plain text (.txt) files into clean, professional PDF documents.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Simple conversion (creates sample.pdf in same folder)
  python3 company/txt_to_pdf.py sample.txt

  # Convert with explicit output path
  python3 company/txt_to_pdf.py JD.txt /path/to/output.pdf

  # Convert in monospace code mode with 9pt font
  python3 company/txt_to_pdf.py logs.txt --font mono --font-size 9

  # Specify page size and header
  python3 company/txt_to_pdf.py report.txt -p letter --title "Monthly Report"
        """
    )
    parser.add_argument("input_path", type=str, help="Path to the input text file (.txt)")
    parser.add_argument("output_path", type=str, nargs="?", default=None,
                        help="Optional path for the output PDF. Defaults to input file with .pdf extension")
    parser.add_argument("-o", "--output", type=str, dest="opt_output", default=None,
                        help="Alternative way to specify output PDF path")
    parser.add_argument("-p", "--page-size", type=str, default="a4", choices=["a4", "letter", "legal", "a3", "a5"],
                        help="Page size (default: a4)")
    parser.add_argument("--orientation", type=str, default="portrait", choices=["portrait", "landscape"],
                        help="Page orientation (default: portrait)")
    parser.add_argument("-f", "--font", type=str, default="sans",
                        help="Font family: 'sans' (default), 'mono' (monospace/code), 'serif', or standard PDF font")
    parser.add_argument("-s", "--font-size", type=float, default=10.0,
                        help="Font size in pt (default: 10.0)")
    parser.add_argument("-l", "--line-spacing", type=float, default=None,
                        help="Line height/leading in pt (default: 1.35x font size)")
    parser.add_argument("-m", "--margin", type=float, default=54.0,
                        help="Page margin in points (default: 54 pt = 0.75 in)")
    parser.add_argument("--title", type=str, default=None,
                        help="Document title to display in top running header")
    parser.add_argument("--no-footer", action="store_true",
                        help="Disable page numbering in footer")
    parser.add_argument("--encoding", type=str, default=None,
                        help="Input file encoding (default: auto-detect utf-8 / latin-1)")
    return parser.parse_args()


def main():
    if len(sys.argv) == 1:
        print("Usage: python3 txt_to_pdf.py <input_file.txt> [output_file.pdf]")
        print("Try 'python3 txt_to_pdf.py --help' for all options.")
        sys.exit(1)

    args = parse_arguments()

    # Determine output path from either positional argument or -o flag
    final_output = args.opt_output if args.opt_output else args.output_path

    options = {
        'page_size': args.page_size,
        'orientation': args.orientation,
        'font': args.font,
        'font_size': args.font_size,
        'margin': args.margin,
        'show_footer': not args.no_footer,
        'header_text': args.title,
        'encoding': args.encoding,
    }
    if args.line_spacing is not None:
        options['line_spacing'] = args.line_spacing

    try:
        output_pdf = convert_txt_to_pdf(args.input_path, final_output, **options)
        print(f"Successfully converted '{args.input_path}' -> '{output_pdf}'")
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error converting file: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
