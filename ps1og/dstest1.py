import re
import requests
import spacy
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Access the VirusTotal API key
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")

# Ensure the API key is loaded
if not VIRUSTOTAL_API_KEY:
    raise ValueError("API key not found. Make sure it is set in the .env file.")

# Load the spaCy model for named entity recognition
nlp = spacy.load("en_core_web_sm")

def extract_threat_intelligence(report_text):
    # Initialize the output dictionary
    threat_intel = {
        'IoCs': {
            'IP addresses': [],
            'Domains': [],
            'File hashes': [],
            'Email addresses': []
        },
        'TTPs': {
            'Tactics': [],
            'Techniques': []
        },
        'Threat Actor(s)': [],
        'Malware': [],
        'Targeted Entities': []
    }

    # Extract Indicators of Compromise (IoCs)
    threat_intel['IoCs']['IP addresses'] = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', report_text)
    threat_intel['IoCs']['Domains'] = re.findall(r'\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b', report_text)
    threat_intel['IoCs']['File hashes'] = re.findall(r'\b[a-fA-F0-9]{32,}\b', report_text)
    threat_intel['IoCs']['Email addresses'] = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', report_text)

    # Extract Tactics, Techniques, and Procedures (TTPs)
    tactics = {
        'Initial Access': 'TA0001',
        'Execution': 'TA0002',
        'Lateral Movement': 'TA0008'
    }
    techniques = {
        'Spear Phishing Attachment': 'T1566.001',
        'PowerShell': 'T1059.001'
    }
    for tactic, code in tactics.items():
        if tactic.lower() in report_text.lower():
            threat_intel['TTPs']['Tactics'].append([code, tactic])
    for technique, code in techniques.items():
        if technique.lower() in report_text.lower():
            threat_intel['TTPs']['Techniques'].append([code, technique])

    # Extract Threat Actor(s) using spaCy NER
    doc = nlp(report_text)
    for ent in doc.ents:
        if ent.label_ == "ORG" and "APT" in ent.text:
            threat_intel['Threat Actor(s)'].append(ent.text)

    # Extract Malware details
    malware_names = re.findall(r'\b[A-Z][a-zA-Z]+\b', report_text)
    for name in malware_names:
        if name.lower() in report_text.lower() and name not in threat_intel['Threat Actor(s)']:
            malware_details = get_malware_details(name)
            if malware_details:
                threat_intel['Malware'].append(malware_details)

    # Extract Targeted Entities using spaCy NER
    for ent in doc.ents:
        if ent.label_ == "ORG" and ent.text not in threat_intel['Threat Actor(s)']:
            threat_intel['Targeted Entities'].append(ent.text)

    return threat_intel

def get_malware_details(malware_name):
    """Query VirusTotal API for malware details."""
    url = f"https://www.virustotal.com/api/v3/files/{malware_name}"
    headers = {"x-apikey": VIRUSTOTAL_API_KEY}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        attributes = data.get('data', {}).get('attributes', {})
        return {
            'Name': malware_name,
            'md5': attributes.get('md5', ''),
            'sha1': attributes.get('sha1', ''),
            'sha256': attributes.get('sha256', ''),
            'ssdeep': attributes.get('ssdeep', ''),
            'TLSH': attributes.get('tlsh', ''),
            'tags': attributes.get('tags', [])
        }
    return None

# Example Usage
report_text = '''
The APT33 group, suspected to be from Iran, has launched a new campaign targeting
the energy sector organizations.
The attack utilizes Shamoon malware, known for its destructive capabilities. The threat
actor exploited a vulnerability in the network perimeter to gain initial access.
The malware was delivered via spear-phishing emails containing a malicious
attachment. The malware's behavior was observed communicating with IP address
192.168.1.1 and domain example.com. The attack also involved lateral movement using
PowerShell scripts.
'''

result = extract_threat_intelligence(report_text)
print(result)