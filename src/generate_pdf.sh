#!/bin/bash

set -e

# Create a temporary directory for LaTeX compilation
TMP_DIR=$(mktemp -d)
# Ensure the temporary directory is cleaned up when the script exits
trap 'rm -rf "$TMP_DIR"' EXIT

INPUT_TEX="$TMP_DIR/input.tex"

# Check if input is coming from stdin (pipeline)
if [ ! -t 0 ]; then
    # Read LaTeX code from stdin
    cat > "$INPUT_TEX"
    OUTPUT_NAME="output.pdf"
elif [ $# -ge 1 ]; then
    # Read LaTeX code from a file
    cp "$1" "$INPUT_TEX"
    if [ $# -ge 2 ]; then
        OUTPUT_NAME="$2"
    else
        OUTPUT_NAME="$(basename "$1" .tex).pdf"
    fi
else
    echo "Usage:" >&2
    echo "  $0 input.tex [output.pdf]" >&2
    echo "  cat input.tex | $0 > output.pdf" >&2
    exit 1
fi

# Compile the LaTeX code to PDF using pdflatex
# (You can change pdflatex to xelatex or lualatex if your resume requires specific fonts)
echo "Compiling LaTeX..." >&2
if ! pdflatex -interaction=nonstopmode -halt-on-error -output-directory="$TMP_DIR" "$INPUT_TEX" > "$TMP_DIR/compile.log" 2>&1; then
    echo "Error: LaTeX compilation failed." >&2
    cat "$TMP_DIR/compile.log" >&2
    exit 1
fi

# Determine how to output the resulting PDF
if [ ! -t 1 ]; then
    # Output to stdout (useful for pipelines: ./generate_pdf.sh input.tex > out.pdf)
    cat "$TMP_DIR/input.pdf"
else
    # Save to a file in the current directory
    cp "$TMP_DIR/input.pdf" "$OUTPUT_NAME"
    echo "Successfully generated $OUTPUT_NAME" >&2
fi
