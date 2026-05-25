#!/bin/bash
cd /Users/marwa/Library/CloudStorage/OneDrive-prevalent.ai/Documents/EM-UI
git add CHANGELOG.md package.json src/data/changelog.json
git commit -m "chore: bump to v0.4.0

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
rm -- "$0"
