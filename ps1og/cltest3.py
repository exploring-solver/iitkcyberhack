import re
import json
import requests
from typing import Dict, List, Any
import spacy
from collections import defaultdict
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ThreatIntelExtractor:
    def __init__(self):
        # Initialize spaCy model
        self.nlp = spacy.load("en_core_web_sm")
        
        # Initialize VirusTotal API key
        self.vt_api_key = os.getenv('VIRUSTOTAL_API_KEY')
        
        # Compile regex patterns
        self.ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
        self.domain_pattern = re.compile(r'\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b')
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.hash_pattern = re.compile(r'\b[A-Fa-f0-9]{32,64}\b')

        # MITRE ATT&CK mapping (simplified example)
        self.mitre_tactics = {
            'initial access': 'TA0001',
            'execution': 'TA0002',
            'lateral movement': 'TA0008'
        }
        
        self.mitre_techniques = {
            'spear phishing': 'T1566.001',
            'powershell': 'T1059.001'
        }

    def get_malware_details(self, malware_name: str) -> Dict:
        """Get malware details from VirusTotal API"""
        if not self.vt_api_key:
            return {}

        headers = {'x-apikey': self.vt_api_key}
        url = f'https://www.virustotal.com/api/v3/search?query={malware_name}'
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                # Process and return relevant malware details
                return data.get('data', {})
            return {}
        except Exception as e:
            print(f"Error fetching malware details: {e}")
            return {}

    def extract_iocs(self, text: str) -> Dict[str, List[str]]:
        """Extract IoCs from text"""
        return {
            'IP addresses': list(set(re.findall(self.ip_pattern, text))),
            'Domains': list(set(re.findall(self.domain_pattern, text))),
            'Email addresses': list(set(re.findall(self.email_pattern, text))),
            'Hashes': list(set(re.findall(self.hash_pattern, text)))
        }

    def extract_ttps(self, text: str) -> Dict[str, List]:
        """Extract TTPs from text"""
        doc = self.nlp(text.lower())
        
        tactics = []
        techniques = []
        
        # Extract tactics and techniques based on keyword matching
        for tactic, code in self.mitre_tactics.items():
            if tactic in text.lower():
                tactics.append([code, tactic.title()])
                
        for technique, code in self.mitre_techniques.items():
            if technique in text.lower():
                techniques.append([code, technique.title()])
        
        return {
            'Tactics': tactics,
            'Techniques': techniques
        }

    def extract_threat_actors(self, text: str) -> List[str]:
        """Extract threat actor names"""
        doc = self.nlp(text)
        threat_actors = []
        
        # Look for potential threat actor patterns (e.g., APT + number)
        apt_pattern = re.compile(r'APT\d+|[A-Z][a-z]+ Team|[A-Z][a-z]+ Group')
        threat_actors.extend(re.findall(apt_pattern, text))
        
        return list(set(threat_actors))

    def extract_targeted_entities(self, text: str) -> List[str]:
        """Extract targeted entities and sectors"""
        doc = self.nlp(text)
        targets = []
        
        # Look for organization names and industry sectors
        for ent in doc.ents:
            if ent.label_ in ['ORG', 'GPE']:
                targets.append(ent.text)
                
        # Look for specific sector mentions
        sectors = ['energy sector', 'financial sector', 'healthcare sector']
        for sector in sectors:
            if sector.lower() in text.lower():
                targets.append(sector.title())
                
        return list(set(targets))

    def process_report(self, report_text: str) -> Dict[str, Any]:
        """Process the entire threat report and extract all intelligence data"""
        # Extract all components
        iocs = self.extract_iocs(report_text)
        ttps = self.extract_ttps(report_text)
        threat_actors = self.extract_threat_actors(report_text)
        targeted_entities = self.extract_targeted_entities(report_text)
        
        # Extract malware names and get details
        malware_details = []
        malware_pattern = re.compile(r'(?:malware|ransomware|trojan)\s+(?:called|named)?\s+([A-Za-z0-9-]+)', re.IGNORECASE)
        malware_matches = malware_pattern.findall(report_text)
        
        for malware_name in malware_matches:
            details = self.get_malware_details(malware_name)
            if details:
                malware_details.append(details)
        
        return {
            'IoCs': iocs,
            'TTPs': ttps,
            'Threat Actor(s)': threat_actors,
            'Malware': malware_details,
            'Targeted Entities': targeted_entities
        }

def main():
    # Example usage
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
    
    extractor = ThreatIntelExtractor()
    results = extractor.process_report(report_text)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()