import json
import os
import sys
import argparse
import jinja2
import subprocess
import shutil

def load_json(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)

def convert_to_pdf(latex_file_path, config, base_dir):
    """
    Converts the given LaTeX file to a PDF.
    The output location is read from the config file.
    """
    pdf_output_rel_path = config.get("output", {}).get("pdf_file", "output/resume.pdf")
    pdf_output_path = os.path.join(base_dir, pdf_output_rel_path)
    
    pdf_out_dir = os.path.dirname(pdf_output_path)
    if not pdf_out_dir:
        pdf_out_dir = "."
    os.makedirs(pdf_out_dir, exist_ok=True)
    
    print(f"Compiling {latex_file_path} to {pdf_output_path}...")
    
    # Try tectonic first (local or system)
    tectonic_path = os.path.join(base_dir, "bin", "tectonic")
    if not os.path.exists(tectonic_path):
        tectonic_path = shutil.which("tectonic")
        
    pdflatex_path = shutil.which("pdflatex")
    
    if tectonic_path:
        print("Using tectonic to compile...")
        try:
            subprocess.run([
                tectonic_path,
                "-o", pdf_out_dir,
                latex_file_path
            ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # Tectonic outputs {basename}.pdf
            basename = os.path.splitext(os.path.basename(latex_file_path))[0]
            generated_pdf = os.path.join(pdf_out_dir, f"{basename}.pdf")
            
            if os.path.exists(generated_pdf) and generated_pdf != pdf_output_path:
                shutil.move(generated_pdf, pdf_output_path)
                
            print(f"Successfully generated PDF at {pdf_output_path}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error compiling LaTeX to PDF with tectonic. Exited with code {e.returncode}.")
            print("--- output ---")
            print(e.stderr)
            return False
            
    elif pdflatex_path:
        print("Using pdflatex to compile...")
        jobname = os.path.splitext(os.path.basename(pdf_output_path))[0]
        try:
            subprocess.run([
                pdflatex_path,
                f"-interaction=nonstopmode",
                f"-output-directory={pdf_out_dir}",
                f"-jobname={jobname}",
                latex_file_path
            ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            print(f"Successfully generated PDF at {pdf_output_path}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error compiling LaTeX to PDF with pdflatex. Exited with code {e.returncode}.")
            print("--- output ---")
            print(e.stdout)
            return False
    else:
        print("Error: No LaTeX engine found. Please install tectonic or pdflatex to generate PDFs.")
        return False

def main():
    parser = argparse.ArgumentParser(description="Build a tailored resume.")
    parser.add_argument("company", type=str, help="The name of the company this resume is for.")
    args = parser.parse_args()
    
    company_name = args.company
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Load configuration
    config_path = os.path.join(base_dir, "config.json")
    if not os.path.exists(config_path):
        print(f"Error: Config file not found at {config_path}")
        return
    
    config = load_json(config_path)
    
    # 2. Load data from sections
    context = {}
    
    for section_name, file_path in config.get("sections", {}).items():
        full_path = os.path.join(base_dir, file_path)
        if os.path.exists(full_path):
            context[section_name] = load_json(full_path)
        else:
            print(f"Warning: Data file not found at {full_path}")
            context[section_name] = [] # Fallback
            
    # 3. Setup Jinja2 Environment
    template_rel_path = config.get("template", "templates/template.resumelatex")
    template_path = os.path.join(base_dir, template_rel_path)
    template_dir = os.path.dirname(template_path)
    template_name = os.path.basename(template_path)
    
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(template_dir),
        block_start_string='<%',
        block_end_string='%>',
        variable_start_string='<<',
        variable_end_string='>>',
        comment_start_string='<#',
        comment_end_string='#>',
        trim_blocks=True,
        lstrip_blocks=True,
        autoescape=False
    )
    
    # 4. Render Template
    try:
        template = env.get_template(template_name)
        rendered_resume = template.render(context)
    except Exception as e:
        print(f"Error rendering template: {e}")
        return

    # 5. Output LaTeX to file
    latex_out_rel_dir = config.get("output", {}).get("latex_dir", "output/latex_version")
    latex_out_dir = os.path.join(base_dir, latex_out_rel_dir)
    os.makedirs(latex_out_dir, exist_ok=True)
    
    latex_output_filename = f"{company_name}_resume.latex"
    latex_output_path = os.path.join(latex_out_dir, latex_output_filename)
    
    with open(latex_output_path, 'w') as f:
        f.write(rendered_resume)
        
    print(f"Successfully built LaTeX resume for {company_name} at {latex_output_path}")
    
    # 6. Convert to PDF
    convert_to_pdf(latex_output_path, config, base_dir)

if __name__ == "__main__":
    main()
