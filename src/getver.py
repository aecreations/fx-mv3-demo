#!/usr/bin/env python3

import sys
import json

# Open the manifest file and read its contents
with open('manifest.json', 'r') as fh:
    manifest_json = fh.read()

# Parse the JSON content
manifest = json.loads(manifest_json)

# Extract the version from the manifest
ver = manifest.get('version', '')

# Print the version
sys.stdout.write(ver)
