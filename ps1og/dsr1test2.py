import re
import requests
import spacy
from typing import Dict, List, Union
from dotenv import load_dotenv
import os
from PyPDF2 import PdfReader

# Load environment variables from the .env file
load_dotenv()

# Access the VirusTotal API key
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
# Load English language model for spaCy
nlp = spacy.load("en_core_web_sm")

MITRE_MAPPINGS = {
    'tactics': {
        'initial access': 'TA0001',
        'execution': 'TA0002',
        'lateral movement': 'TA0008'
    },
    'techniques': {
        'spear-phishing attachment': 'T1566.001',
        'powershell': 'T1059.001',
        'exploit public-facing application': 'T1190'
    }
}

def extract_text_from_pdf(file_path):
    """Extract text from a PDF file."""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise ValueError(f"Error reading PDF file: {e}")

def extract_text_from_input(input_data):
    """
    Extract text based on the input type (text, file, or PDF).
    """
    if isinstance(input_data, str) and os.path.exists(input_data):
        # If the input is a file path
        if input_data.lower().endswith(".pdf"):
            return extract_text_from_pdf(input_data)
        else:
            with open(input_data, "r", encoding="utf-8") as file:
                return file.read()
    elif isinstance(input_data, str):
        # If the input is plain text
        return input_data
    else:
        raise ValueError("Invalid input. Provide text, a text file, or a PDF file.")
    
def extract_threat_intelligence(report_text: str) -> Dict[str, Union[Dict, List]]:
    """Main function to extract threat intelligence from reports."""
    return {
        'IoCs': extract_iocs(report_text),
        'TTPs': extract_ttps(report_text),
        'Threat Actor(s)': extract_threat_actors(report_text),
        'Malware': extract_malware_info(report_text),
        'Targeted Entities': extract_targets(report_text)
    }

def extract_iocs(text: str) -> Dict[str, List]:
    """Extract Indicators of Compromise using regex patterns."""
    patterns = {
        'IP addresses': r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
        'Domains': r'\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b',
        'File hashes': r'\b[a-fA-F0-9]{32,}\b',
        'Email addresses': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    }
    return {key: re.findall(pattern, text) for key, pattern in patterns.items()}

def extract_ttps(text: str) -> Dict[str, List]:
    """Identify MITRE ATT&CK TTPs using keyword matching."""
    tactics = []
    techniques = []
    
    for tactic, code in MITRE_MAPPINGS['tactics'].items():
        if re.search(rf'\b{tactic}\b', text, re.IGNORECASE):
            tactics.append([code, tactic.title()])
    
    for technique, code in MITRE_MAPPINGS['techniques'].items():
        if re.search(rf'\b{technique}\b', text, re.IGNORECASE):
            techniques.append([code, technique.title()])
    
    return {'Tactics': tactics, 'Techniques': techniques}

def extract_threat_actors(text: str) -> List[str]:
    """Detect threat actor groups using NER and patterns."""
    doc = nlp(text)
    actors = []
    
    # Look for APT patterns
    apt_pattern = re.compile(r'\bAPT\d+\b', re.IGNORECASE)
    actors.extend(apt_pattern.findall(text))
    
    # Look for ORG entities containing threat-related keywords
    threat_keywords = {'group', 'actor', 'campaign', 'malicious'}
    for ent in doc.ents:
        if ent.label_ == 'ORG' and any(keyword in ent.text.lower() for keyword in threat_keywords):
            actors.append(ent.text)
    
    return list(set(actors))

def extract_malware_info(text: str) -> List[Dict]:
    """Extract and enrich malware information."""
    malware_names = re.findall(r'\b[A-Z][a-z]+(?: [A-Z][a-z]+)*\b', text)
    malware_info = []
    
    for name in set(malware_names):
        if name.lower() in ['apt', 'mitre']:  # Filter false positives
            continue
            
        details = {'Name': name}
        vt_data = query_virustotal(name)
        if vt_data:
            details.update(vt_data)
        malware_info.append(details)
    
    return malware_info

def query_virustotal(malware_name: str) -> Dict:
    """Query VirusTotal API for malware details."""
    url = f"https://www.virustotal.com/api/v3/files/{malware_name}"
    headers = {"x-apikey": VIRUSTOTAL_API_KEY}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            attributes = response.json().get('data', {}).get('attributes', {})
            return {
                'md5': attributes.get('md5', ''),
                'sha1': attributes.get('sha1', ''),
                'sha256': attributes.get('sha256', ''),
                'ssdeep': attributes.get('ssdeep', ''),
                'tags': attributes.get('tags', []),
                'TLSH': attributes.get('tlsh', '')
            }
    except requests.exceptions.RequestException:
        pass
    return {}

def extract_targets(text: str) -> List[str]:
    """Identify targeted entities using NER and keywords."""
    doc = nlp(text)
    targets = []
    industry_keywords = {'sector', 'industry', 'organization', 'enterprise'}
    
    # Look for entities near targeting verbs
    for sent in doc.sents:
        if 'target' in sent.text.lower():
            for ent in sent.ents:
                if ent.label_ in ['ORG', 'GPE'] and ent.text not in targets:
                    targets.append(ent.text)
    
    # Look for industry mentions
    for token in doc:
        if token.text.lower() in industry_keywords and token.head.text.isalpha():
            targets.append(token.head.text.title())
    
    return list(set(targets))

# Example Usage
if __name__ == "__main__":
    # Prompt for input or use default text
    input_type = input("Enter input type (text/file/pdf): ").strip().lower()
    
    if input_type == "text":
        report_text = input("Enter the report text: ")
    elif input_type in {"file", "pdf"}:
        file_path = input("Enter the file path: ").strip()
        report_text = file_path
    else:
        print("Invalid input type. Exiting.")
        exit(1)
    
    try:
        result = extract_threat_intelligence(report_text)
        print(result)
    except ValueError as e:
        print(f"Error: {e}")