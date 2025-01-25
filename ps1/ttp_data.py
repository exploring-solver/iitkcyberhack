# from mitreattackdata import MitreAttackData
from mitreattack.stix20 import MitreAttackData
# Initialize the MitreAttackData object
attack_data = MitreAttackData("ps1/enterprise-attack.json")


# Retrieve techniques and their associated tactics
techniques = attack_data.get_techniques()
# print(techniques)


groups = attack_data.get_groups()
# print(groups)

tactics = attack_data.get_tactics()
print(tactics)

# https://mitreattack-python.readthedocs.io/en/latest/mitre_attack_data/mitre_attack_data.html#mitreattackdata