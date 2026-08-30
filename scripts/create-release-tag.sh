#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Release Tag Creator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get version from cli/package.json
VERSION=$(grep '"version"' cli/package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
TAG="v${VERSION}"

echo -e "${YELLOW}Version from package.json: ${VERSION}${NC}"
echo -e "${YELLOW}Tag to create: ${TAG}${NC}"
echo ""

# Validate tag format
if ! [[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+)?$ ]]; then
    echo -e "${RED}❌ Invalid version format in package.json: ${VERSION}${NC}"
    echo -e "${RED}Expected format: X.Y.Z or X.Y.Z-beta.N${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Version format valid${NC}"
echo ""

# GATE: lockfile sync. The CI package smoke test enforces this only AFTER the
# tag is pushed (v0.8.0's first pipeline run failed there). Fail HERE, before
# any tag is touched.
LOCK_VERSION=$(grep '"version"' cli/package-lock.json 2>/dev/null | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
if [ "$LOCK_VERSION" != "$VERSION" ]; then
    echo -e "${RED}❌ cli/package-lock.json version '${LOCK_VERSION:-missing}' != cli/package.json version '${VERSION}'${NC}"
    echo -e "${RED}   The CI package smoke test would fail only after the tag is pushed.${NC}"
    echo -e "${RED}   Fix: cd cli && npm version ${VERSION} --no-git-tag-version, commit and push, merge to production (stable only), re-run this script.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ package-lock.json in sync (${LOCK_VERSION})${NC}"
echo ""

# Fetch latest tags from remote
echo -e "${YELLOW}Fetching tags from remote...${NC}"
git fetch --tags origin 2>/dev/null || true

# Check if tag exists locally
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Tag $TAG exists locally, deleting...${NC}"
    git tag -d "$TAG"
fi

# Check if tag exists on remote
if git ls-remote --tags origin | grep -q "refs/tags/$TAG$"; then
    echo -e "${YELLOW}⚠ Tag $TAG exists on remote, deleting...${NC}"
    git push origin --delete "$TAG" 2>/dev/null || true
    sleep 1
fi

echo ""
echo -e "${YELLOW}Creating annotated tag: $TAG${NC}"

# Check if release notes file exists
NOTES_FILE="/tmp/release-notes-${TAG}.md"
if [ -f "$NOTES_FILE" ]; then
    echo -e "${YELLOW}Using release notes from: $NOTES_FILE${NC}"
    git tag -a "$TAG" -F "$NOTES_FILE"
else
    echo -e "${YELLOW}No release notes file found at $NOTES_FILE${NC}"
    echo -e "${YELLOW}Creating tag with empty message...${NC}"
    git tag -a "$TAG" -m "Release $TAG"
fi

echo ""
echo -e "${YELLOW}Pushing tag to remote...${NC}"
git push origin "$TAG"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Release tag created successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Tag: ${TAG}${NC}"
echo -e "${BLUE}Release URL: https://github.com/brabos-ai/code-addiction/releases/tag/${TAG}${NC}"
echo ""
echo -e "${YELLOW}The CI pipeline will automatically:${NC}"
echo -e "${YELLOW}  1. Build the framework${NC}"
echo -e "${YELLOW}  2. Package ZIP archive${NC}"
echo -e "${YELLOW}  3. Create GitHub Release${NC}"
echo -e "${YELLOW}  4. Publish to npm${NC}"
echo ""

git log -1 --oneline "$TAG"
