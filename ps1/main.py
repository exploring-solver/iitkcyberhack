# import re
# import requests


# def extract_iocs(text):
#     iocs = {
#         "IP addresses": re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', text),
#         "Domains": re.findall(r'[a-zA-Z0-9-]+\.[a-zA-Z]{2,}', text),
#     }
#     return iocs

# def extract_ttps(text):
#     ttp_mapping = {
#         "spear-phishing": {"Tactics": ["TA0001"], "Techniques": ["T1566.001"]},
#         "powershell": {"Tactics": ["TA0002"], "Techniques": ["T1059.001"]},
#     }
#     tactics = []
#     techniques = []
#     for keyword, mapping in ttp_mapping.items():
#         if keyword in text.lower():
#             tactics.extend(mapping["Tactics"])
#             techniques.extend(mapping["Techniques"])
#     return {"Tactics": tactics, "Techniques": techniques}

# def extract_threat_actors(text):
#     threat_actors = ["APT33", "Lazarus", "BlueNoroff"]
#     return [actor for actor in threat_actors if actor in text]

# def enrich_malware(hash_value, api_key):
#     url = f"https://www.virustotal.com/api/v3/files/{hash_value}"
#     headers = {"x-apikey": api_key}
#     response = requests.get(url, headers=headers)
#     return response.json()

# def extract_threat_intelligence(report_text):
#     return {
#         "IoCs": extract_iocs(report_text),
#         "TTPs": extract_ttps(report_text),
#         "Threat Actor(s)": extract_threat_actors(report_text),
#         "Malware": [{"Name": "Shamoon"}],  # Enrich with VirusTotal
#         "Targeted Entities": ["Energy Sector"],  # Example
#     }


# if __name__ == '__main__' :
#     report_text = 'The APT33 group, suspected to be from Iran, has launched a new campaign targeting the energy sector organizations. The attack utilizes Shamoon malware, known for its destructive capabilities. The threat actor exploited a vulnerability in the network perimeter to gain initial access. The malware was delivered via spear-phishing emails containing a malicious attachment. The malware\'s behavior was observed communicating with IP address 192.168.1.1 and domain example.com. The attack also involved lateral movement using PowerShell scripts.'
#     print(extract_threat_intelligence(report_text=report_text))



import re
import requests


class ThreatIntelligenceExtractor:
    def __init__(self, api_key=None):
        self.api_key = api_key  # For VirusTotal or other APIs

    def extract_iocs(self, text):
        iocs = {
            "IP addresses": re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', text),
            "Domains": re.findall(r'[a-zA-Z0-9-]+\.[a-zA-Z]{2,}', text),
            "File Hashes": re.findall(r'\b[a-fA-F0-9]{32}\b|\b[a-fA-F0-9]{40}\b|\b[a-fA-F0-9]{64}\b', text),
            "Email Addresses": re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text),
        }
        return iocs

    def fetch_ttps(self):
        # Fetch TTPs from MITRE ATT&CK Framework
        # url = "https://attack.mitre.org/api.php?action=ask&query=[[Has+technique+ID::+*]]|mainlabel=Technique|?Has+ID|?Has+tactic|format=json"
        # response = requests.get(url).json()
        # ttp_mapping = {}
        # for item in response.get("query", {}).get("results", {}).values():
        #     tactic = item.get("printouts", {}).get("Has tactic", [])[0] if item.get("printouts", {}).get("Has tactic") else "Unknown"
        #     technique_id = item.get("printouts", {}).get("Has ID", [])[0]
        #     ttp_mapping[technique_id] = tactic
        # return ttp_mapping
        return  {
            "spear-phishing": {"Tactics": ["TA0001"], "Techniques": ["T1566.001"]},
            "powershell": {"Tactics": ["TA0002"], "Techniques": ["T1059.001"]},
        }

    def extract_ttps(self, text):
        ttp_mapping = self.fetch_ttps()  # Get the complete TTP dictionary
        extracted_tactics = []
        extracted_techniques = []
        for keyword, tactic in ttp_mapping.items():
            if keyword.lower() in text.lower():
                extracted_tactics.append(tactic)
                extracted_techniques.append(keyword)
        return {"Tactics": extracted_tactics, "Techniques": extracted_techniques}

    def fetch_threat_actors(self):
        # Fetch threat actor names from MITRE ATT&CK
        url = "https://attack.mitre.org/groups/"
        response = requests.get(url).text
        actors = re.findall(r'<td><a href=".*?">(.*?)</a></td>', response)
        return actors

    def extract_threat_actors(self, text):
        threat_actors = self.fetch_threat_actors()
        return [actor for actor in threat_actors if actor.lower() in text.lower()]

    def enrich_malware(self, hash_value):
        if not self.api_key:
            raise ValueError("API key is required for VirusTotal enrichment")
        url = f"https://www.virustotal.com/api/v3/files/{hash_value}"
        headers = {"x-apikey": self.api_key}
        response = requests.get(url, headers=headers)
        return response.json()

    def extract_threat_intelligence(self, report_text):
        return {
            "IoCs": self.extract_iocs(report_text),
            "TTPs": self.extract_ttps(report_text),
            "Threat Actor(s)": self.extract_threat_actors(report_text),
            "Malware": [{"Name": "Shamoon"}],  # Example; add enrichment
            "Targeted Entities": ["Energy Sector"],  # Example
        }


if __name__ == '__main__':
    report_text = '''
    The APT33 group, suspected to be from Iran, has launched a new campaign targeting
    the energy sector organizations. The attack utilizes Shamoon malware, known for its destructive capabilities.
    The threat actor exploited a vulnerability in the network perimeter to gain initial access. The malware was
    delivered via spear-phishing emails containing a malicious attachment. The malware's behavior was observed
    communicating with IP address 192.168.1.1 and domain example.com. The attack also involved lateral movement
    using PowerShell scripts.
    '''
    extractor = ThreatIntelligenceExtractor(api_key="YOUR_VIRUSTOTAL_API_KEY")
    intelligence = extractor.extract_threat_intelligence(report_text)
    print(intelligence)
