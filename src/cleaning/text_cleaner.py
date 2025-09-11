# Text cleaning module
import re

def clean_text(text):
    """Simple text cleaning for Arabic content with math preservation"""
    # Preserve mathematical notations first
    math_markers = []
    math_pattern = r'\[MATH_DETECTED:.*?\]|\[DIAGRAM_DETECTED:.*?\]|\[MATH_BOOK_SUMMARY:.*?\]'
    for match in re.finditer(math_pattern, text):
        placeholder = f"__MATH_MARKER_{len(math_markers)}__"
        math_markers.append(match.group())
        text = text.replace(match.group(), placeholder)
    
    # Normalize Arabic digits
    text = text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
    
    # Preserve mathematical symbols while cleaning
    math_symbols = r'[+\-×÷*/=<>≤≥≠±√∑∏∫°αβγδθπλμσφψω\^\(\)\[\]]'
    
    # Remove extra spaces and empty lines but preserve math content
    lines = []
    for line in text.split('\n'):
        line = line.strip()
        # Keep lines with math markers, math symbols, or meaningful content
        if (line and 
            (len(line) > 2 or 
             '__MATH_MARKER_' in line or 
             re.search(math_symbols, line) or 
             re.search(r'\d+[/\^]\d+', line))):
            lines.append(line)
    
    cleaned_text = '\n'.join(lines)
    
    # Restore math markers
    for i, marker in enumerate(math_markers):
        placeholder = f"__MATH_MARKER_{i}__"
        cleaned_text = cleaned_text.replace(placeholder, marker)
    
    return cleaned_text