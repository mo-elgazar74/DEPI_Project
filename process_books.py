import os
import json
import time
from pathlib import Path
from src.extraction.pdf_extractor import extract_text_from_pdf
from src.cleaning.text_cleaner import clean_text
from src.chunking.text_chunker import create_chunks
from src.search.searcher import search_chunks

def get_subject_from_filename(filename):
    """Extract subject from filename - first word before '_'"""
    # Remove file extension
    name_without_ext = os.path.splitext(filename)[0]
    
    # Get first word before '_'
    first_word = name_without_ext.split('_')[0]
    
    # Capitalize first letter
    subject = first_word.capitalize()
    
    return subject

def save_book_data(book_name, subject, raw_text, cleaned_text, chunks, base_folder="outputs"):
    """Save all data for a book in subject folder"""
    subject_folder = os.path.join(base_folder, subject)
    os.makedirs(subject_folder, exist_ok=True)
    
    book_base = os.path.splitext(book_name)[0]
    
    # Save raw extracted text
    raw_file = os.path.join(subject_folder, f"{book_base}_raw.txt")
    with open(raw_file, 'w', encoding='utf-8') as f:
        f.write(raw_text)
    
    # Save cleaned text
    clean_file = os.path.join(subject_folder, f"{book_base}_cleaned.txt")
    with open(clean_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_text)
    
    # Save chunks as JSON
    chunks_file = os.path.join(subject_folder, f"{book_base}_chunks.json")
    with open(chunks_file, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    
    print(f"Saved files in: {subject_folder}/")
    return raw_file, clean_file, chunks_file

def process_all_books():
    """Process all books and save by subject"""
    books_folder = "books"
    
    all_chunks = []
    book_count = 0
    
    print("🚀 Starting Book Processing")
    print("=" * 50)
    
    # Find all PDF files
    for root, dirs, files in os.walk(books_folder):
        for file in files:
            if file.endswith('.pdf'):
                pdf_path = os.path.join(root, file)
                book_count += 1
                subject = get_subject_from_filename(file)
                
                print(f"\n=== Book {book_count}: {file} ===")
                print(f"Subject: {subject}")
                start_time = time.time()
                
                try:
                    # Extract text
                    print("Extracting text...")
                    raw_text = extract_text_from_pdf(pdf_path)
                    
                    # Clean text
                    print("Cleaning text...")
                    cleaned_text = clean_text(raw_text)
                    
                    # Create chunks
                    print(" Creating chunks...")
                    chunks = create_chunks(cleaned_text)
                    
                    # Prepare chunks with metadata
                    chunk_data = []
                    for i, chunk in enumerate(chunks):
                        chunk_info = {
                            "text": chunk,
                            "book": file,
                            "subject": subject,
                            "chunk_id": i + 1,
                            "total_chunks": len(chunks)
                        }
                        chunk_data.append(chunk_info)
                        all_chunks.append(chunk_info)
                    
                    # Save all data for this book
                    save_book_data(file, subject, raw_text, cleaned_text, chunk_data)
                    
                    process_time = time.time() - start_time
                    print(f"  ✅ Processed {len(chunks)} chunks in {process_time:.2f} seconds")
                    
                except Exception as e:
                    print(f"  ❌ Error processing {file}: {e}")
    
    # Save combined chunks
    os.makedirs("outputs", exist_ok=True)
    combined_file = "outputs/all_books_combined.json"
    with open(combined_file, 'w', encoding='utf-8') as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)
    
    print(f"\n Processing Complete!")
    print(f"Total books processed: {book_count}")
    print(f"Total chunks created: {len(all_chunks)}")
    print(f"Combined file saved: {combined_file}")
    
    return all_chunks


def main():
    
    chunks = process_all_books()
    
if __name__ == "__main__":
    main()