import re

# Regex pattern to match special characters
special_characters_pattern = re.compile(r'[!@#$%^&*(),.?":{}|<>]')

# Regex pattern to match common email formats
email_pattern = re.compile(
    r'^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|icloud\.com|aol\.com|mail\.com|zoho\.com)$'
)