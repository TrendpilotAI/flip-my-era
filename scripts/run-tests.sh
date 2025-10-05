#!/bin/bash

# Flip My Era - Comprehensive Test Runner Script
# This script runs all tests with coverage and generates reports

echo "================================================"
echo "Flip My Era - Test Suite Runner"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Run type checking
echo -e "\n${YELLOW}Running TypeScript type check...${NC}"
npm run typecheck
print_status $? "TypeScript type check"

# Run linter
echo -e "\n${YELLOW}Running ESLint...${NC}"
npm run lint
LINT_STATUS=$?
print_status $LINT_STATUS "ESLint check"

# Run unit tests
echo -e "\n${YELLOW}Running unit tests...${NC}"
npm test -- --run
TEST_STATUS=$?
print_status $TEST_STATUS "Unit tests"

# Run tests with coverage
echo -e "\n${YELLOW}Running tests with coverage...${NC}"
npm run test:coverage
COVERAGE_STATUS=$?
print_status $COVERAGE_STATUS "Test coverage"

# Generate coverage report
if [ $COVERAGE_STATUS -eq 0 ]; then
    echo -e "\n${YELLOW}Coverage Report:${NC}"
    # Display coverage summary
    if [ -f "coverage/coverage-summary.json" ]; then
        node -e "
        const coverage = require('./coverage/coverage-summary.json');
        const total = coverage.total;
        console.log('');
        console.log('Coverage Summary:');
        console.log('================');
        console.log('Statements   : ' + total.statements.pct + '%');
        console.log('Branches     : ' + total.branches.pct + '%');
        console.log('Functions    : ' + total.functions.pct + '%');
        console.log('Lines        : ' + total.lines.pct + '%');
        console.log('');
        
        // Check if coverage meets thresholds
        const threshold = 80;
        if (total.lines.pct < threshold) {
            console.log('\x1b[33m⚠ Warning: Coverage is below ' + threshold + '%\x1b[0m');
        } else {
            console.log('\x1b[32m✓ Coverage meets threshold of ' + threshold + '%\x1b[0m');
        }
        "
    fi
    
    echo -e "\n${GREEN}Coverage report generated in ./coverage/index.html${NC}"
fi

# Summary
echo -e "\n================================================"
echo "Test Suite Summary"
echo "================================================"

TOTAL_ERRORS=0

if [ $LINT_STATUS -ne 0 ]; then
    echo -e "${RED}✗ Linting failed${NC}"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
else
    echo -e "${GREEN}✓ Linting passed${NC}"
fi

if [ $TEST_STATUS -ne 0 ]; then
    echo -e "${RED}✗ Some tests failed${NC}"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
else
    echo -e "${GREEN}✓ All tests passed${NC}"
fi

if [ $COVERAGE_STATUS -ne 0 ]; then
    echo -e "${RED}✗ Coverage generation failed${NC}"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
else
    echo -e "${GREEN}✓ Coverage report generated${NC}"
fi

echo ""
if [ $TOTAL_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ $TOTAL_ERRORS check(s) failed${NC}"
    exit 1
fi