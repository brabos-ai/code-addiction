#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Cintia Andrade Hub - Release Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"

# Fetch latest from remote
echo -e "${YELLOW}Fetching latest from remote...${NC}"
git fetch origin

# Switch to main branch and pull latest
echo -e "${YELLOW}Switching to main branch...${NC}"
git checkout main
git pull origin main

# Switch to production branch (create if it doesn't exist)
echo -e "${YELLOW}Switching to production branch...${NC}"
if git show-ref --verify --quiet refs/heads/production; then
    git checkout production
    git pull origin production
else
    echo -e "${YELLOW}Creating production branch from main...${NC}"
    git checkout -b production
fi

# Merge main into production
echo -e "${YELLOW}Merging main into production...${NC}"
git merge main -m "Merge main into production for release"

# Push production to remote
echo -e "${YELLOW}Pushing production to remote...${NC}"
git push origin production

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Release completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Returning to branch: ${CURRENT_BRANCH}${NC}"
git checkout "${CURRENT_BRANCH}"

echo -e "${GREEN}Done!${NC}"
