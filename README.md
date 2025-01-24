### Hack IITK 2024-2025

# Threat Intelligence Extractor

This tool automatically extracts key threat intelligence data from natural language threat reports.

## Features

- Extracts Indicators of Compromise (IoCs)
  - IP addresses
  - Domains
  - Email addresses
  - File hashes
- Identifies TTPs using MITRE ATT&CK framework
- Detects threat actor names
- Extracts malware details with VirusTotal integration
- Identifies targeted entities and sectors

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/threat-intel-extractor.git
cd threat-intel-extractor
```

2. Install dependencies:
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

3. Set up environment variables:
Create a `.env` file with your VirusTotal API key:
```
VIRUSTOTAL_API_KEY=your_api_key_here
```

## Usage

```python
from threat_intel_extractor import ThreatIntelExtractor

# Initialize the extractor
extractor = ThreatIntelExtractor()

# Process a threat report
report_text = "Your threat report text here..."
results = extractor.process_report(report_text)
print(results)
```

## Dependencies

- spacy
- requests
- python-dotenv
- re (built-in)
- json (built-in)

## Limitations and Future Improvements

1. The current MITRE ATT&CK mapping is simplified and could be expanded
2. Natural language processing could be improved with custom training
3. Additional IoC types could be added
4. More threat intelligence sources could be integrated
5. Performance optimization for large reports

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
```

This solution provides:
1. A complete Python implementation with modular design
2. Integration with VirusTotal API for malware enrichment
3. Comprehensive IoC extraction using regex patterns
4. MITRE ATT&CK framework integration
5. Natural language processing using spaCy
6. Clear documentation and usage examples
7. Error handling and type hints
8. Environment variable support for API keys

The code can be further enhanced by:
1. Adding more comprehensive MITRE ATT&CK mappings
2. Implementing custom NER models for better entity recognition
3. Adding more threat intelligence sources
4. Implementing caching for API calls
5. Adding unit tests
6. Implementing more sophisticated text preprocessing
