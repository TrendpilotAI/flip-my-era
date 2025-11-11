#!/usr/bin/env node
/**
 * Import Linear Tickets Script
 * 
 * Creates issues in Linear from LINEAR_TICKETS.md
 * 
 * Usage:
 *   LINEAR_API_KEY=lin_api_... node scripts/import-linear-tickets.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('❌ Error: LINEAR_API_KEY environment variable is required');
  console.error('\nPlease set the API key before running this script:');
  console.error('  export LINEAR_API_KEY=lin_api_...');
  console.error('  node scripts/import-linear-tickets.js\n');
  console.error('Or run it inline:');
  console.error('  LINEAR_API_KEY=lin_api_... node scripts/import-linear-tickets.js\n');
  process.exit(1);
}
const LINEAR_TEAM_ID = '5b8dab04-51d2-42b1-8eb5-eb1f658a1ab0'; // Trendpilotai team

// Priority mapping (Linear: 0=No priority, 1=Urgent, 2=High, 3=Normal, 4=Low)
const PRIORITY_MAP = {
  'Critical': 1, // Urgent
  'High': 2,
  'Medium': 3,
  'Low': 4,
};

/**
 * GraphQL query helper
 */
async function graphqlQuery(query, variables = {}) {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': LINEAR_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  
  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
  }
  
  return result.data;
}

// Cache for labels to avoid repeated queries
const labelCache = new Map();

/**
 * Get all labels for the team
 */
async function getAllLabels() {
  if (labelCache.size > 0) {
    return Array.from(labelCache.values());
  }
  
  const query = `
    query GetLabels {
      issueLabels {
        nodes {
          id
          name
        }
      }
    }
  `;
  
  const data = await graphqlQuery(query);
  
  if (data.issueLabels?.nodes) {
    data.issueLabels.nodes.forEach(label => {
      labelCache.set(label.name.toLowerCase(), label.id);
      labelCache.set(label.name, label.id);
    });
  }
  
  return Array.from(labelCache.values());
}

/**
 * Get or create label
 */
async function getOrCreateLabel(name) {
  // Normalize name
  const normalizedName = name.toLowerCase();
  
  // Check cache first
  if (labelCache.has(normalizedName)) {
    return labelCache.get(normalizedName);
  }
  
  // Load all labels if cache is empty
  await getAllLabels();
  
  // Check cache again after loading
  if (labelCache.has(normalizedName)) {
    return labelCache.get(normalizedName);
  }
  
  // Try to find by exact match (case-insensitive)
  const query = `
    query GetLabels {
      issueLabels {
        nodes {
          id
          name
        }
      }
    }
  `;
  
  const data = await graphqlQuery(query);
  
  if (data.issueLabels?.nodes) {
    const existing = data.issueLabels.nodes.find(
      label => label.name.toLowerCase() === normalizedName
    );
    
    if (existing) {
      labelCache.set(normalizedName, existing.id);
      labelCache.set(existing.name, existing.id);
      return existing.id;
    }
  }
  
  // Create new label (capitalize first letter)
  const labelName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  
  const createMutation = `
    mutation CreateLabel($input: IssueLabelCreateInput!) {
      issueLabelCreate(input: $input) {
        success
        issueLabel {
          id
          name
        }
      }
    }
  `;
  
  try {
    const createData = await graphqlQuery(createMutation, {
      input: {
        name: labelName,
        teamId: LINEAR_TEAM_ID,
      }
    });
    
    if (createData.issueLabelCreate?.success) {
      const labelId = createData.issueLabelCreate.issueLabel.id;
      labelCache.set(normalizedName, labelId);
      labelCache.set(labelName, labelId);
      return labelId;
    }
  } catch (error) {
    // Label might already exist, try to find it again
    const data = await graphqlQuery(query);
    if (data.issueLabels?.nodes) {
      const existing = data.issueLabels.nodes.find(
        label => label.name.toLowerCase() === normalizedName || 
                 label.name.toLowerCase() === labelName.toLowerCase()
      );
      if (existing) {
        labelCache.set(normalizedName, existing.id);
        labelCache.set(existing.name, existing.id);
        return existing.id;
      }
    }
  }
  
  return null;
}

/**
 * Parse LINEAR_TICKETS.md and extract ticket information
 */
function parseTickets(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const tickets = [];
  
  // Split by ticket separator (###)
  const sections = content.split(/^### /m);
  
  for (const section of sections) {
    if (!section.trim() || section.startsWith('#')) continue;
    
    // Skip documentation sections
    if (section.includes('How to Import') || 
        section.includes('Option 1:') || 
        section.includes('Option 2:') ||
        section.includes('Option 3:') ||
        section.includes('Option 4:') ||
        section.includes('Manual Creation') ||
        section.includes('Linear CLI') ||
        section.includes('Linear API') ||
        section.includes('Linear Import Tool')) {
      continue;
    }
    
    const lines = section.split('\n');
    const titleLine = lines[0];
    
    if (!titleLine || !titleLine.includes(':')) continue;
    
    const title = titleLine.split(':')[1]?.trim();
    if (!title) continue;
    
    const ticket = {
      title,
      description: '',
      priority: 4, // Default to Low
      labels: [],
      status: 'backlog',
      estimate: null,
    };
    
    // Parse metadata
    let inDescription = false;
    let descriptionLines = [];
    let inTasks = false;
    let tasks = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('**Priority:**')) {
        const priorityText = line.split('**Priority:**')[1]?.trim();
        ticket.priority = PRIORITY_MAP[priorityText] || 4;
      } else if (line.startsWith('**Status:**')) {
        const status = line.split('**Status:**')[1]?.trim();
        ticket.status = status.toLowerCase().replace(' ', '-');
      } else if (line.startsWith('**Labels:**')) {
        const labels = line.split('**Labels:**')[1]?.trim();
        ticket.labels = labels.split(',').map(l => l.trim());
      } else if (line.startsWith('**Estimate:**')) {
        const estimate = line.split('**Estimate:**')[1]?.trim();
        ticket.estimate = estimate;
      } else if (line.startsWith('**Description:**')) {
        inDescription = true;
      } else if (line.startsWith('**Tasks:**')) {
        inDescription = false;
        inTasks = true;
      } else if (line.startsWith('**Acceptance Criteria:**')) {
        inDescription = false;
        inTasks = false;
        if (descriptionLines.length > 0) {
          ticket.description += '\n\n' + descriptionLines.join('\n');
        }
        if (tasks.length > 0) {
          ticket.description += '\n\n**Tasks:**\n' + tasks.join('\n');
        }
        descriptionLines = [];
        tasks = [];
      } else if (line.startsWith('**Files:**') || line.startsWith('**Related:**') || line.startsWith('---')) {
        inDescription = false;
        inTasks = false;
        if (descriptionLines.length > 0) {
          ticket.description += '\n\n' + descriptionLines.join('\n');
        }
        if (tasks.length > 0) {
          ticket.description += '\n\n**Tasks:**\n' + tasks.join('\n');
        }
        break;
      } else if (inDescription && line) {
        descriptionLines.push(line);
      } else if (inTasks && line.startsWith('- [')) {
        tasks.push(line);
      } else if (line && !line.startsWith('**') && !line.startsWith('---')) {
        // Continue description if we're in a description block
        if (descriptionLines.length > 0 || !ticket.description) {
          descriptionLines.push(line);
        }
      }
    }
    
    // Finalize description
    if (descriptionLines.length > 0 && !ticket.description.includes(descriptionLines[0])) {
      ticket.description += '\n\n' + descriptionLines.join('\n');
    }
    if (tasks.length > 0) {
      ticket.description += '\n\n**Tasks:**\n' + tasks.join('\n');
    }
    
    // Clean up description
    ticket.description = ticket.description.trim();
    
    // Extract description from section if not found
    if (!ticket.description) {
      const descMatch = section.match(/\*\*Description:\*\*\s*\n([\s\S]*?)(?=\*\*|$)/);
      if (descMatch) {
        ticket.description = descMatch[1].trim();
      }
    }
    
    // Add priority label
    if (ticket.priority === 1) ticket.labels.push('p0');
    if (ticket.priority === 2) ticket.labels.push('p1');
    if (ticket.priority === 3) ticket.labels.push('p2');
    if (ticket.priority === 4) ticket.labels.push('p3');
    
    tickets.push(ticket);
  }
  
  return tickets;
}

/**
 * Create issue in Linear
 */
async function createIssue(ticket) {
  // Get label IDs (remove duplicates)
  const labelIdsSet = new Set();
  for (const labelName of ticket.labels) {
    const labelId = await getOrCreateLabel(labelName);
    if (labelId) {
      labelIdsSet.add(labelId);
    }
  }
  const labelIds = Array.from(labelIdsSet);
  
  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;
  
  const variables = {
    input: {
      teamId: LINEAR_TEAM_ID,
      title: ticket.title,
      description: ticket.description || '',
      priority: ticket.priority,
      labelIds: labelIds.length > 0 ? labelIds : undefined,
      stateId: undefined, // Will use default state
    },
  };
  
  try {
    const data = await graphqlQuery(mutation, variables);
    
    if (data.issueCreate?.success) {
      const issue = data.issueCreate.issue;
      return {
        success: true,
        issue,
      };
    } else {
      return {
        success: false,
        error: 'Failed to create issue',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Linear Ticket Importer\n');
  console.log(`📋 Reading LINEAR_TICKETS.md...`);
  
  const ticketsFile = join(__dirname, '..', 'LINEAR_TICKETS.md');
  const tickets = parseTickets(ticketsFile);
  
  console.log(`📦 Found ${tickets.length} tickets\n`);
  
  if (tickets.length === 0) {
    console.error('❌ No tickets found in LINEAR_TICKETS.md');
    process.exit(1);
  }
  
  console.log('📤 Creating issues in Linear...\n');
  
  const results = {
    created: [],
    failed: [],
  };
  
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    console.log(`[${i + 1}/${tickets.length}] Creating: ${ticket.title}...`);
    
    const result = await createIssue(ticket);
    
    if (result.success) {
      console.log(`   ✅ Created: ${result.issue.identifier} - ${result.issue.title}`);
      console.log(`   🔗 URL: ${result.issue.url}\n`);
      results.created.push(result.issue);
    } else {
      console.log(`   ❌ Failed: ${result.error}\n`);
      results.failed.push({ ticket, error: result.error });
    }
    
    // Rate limiting: wait 500ms between requests
    if (i < tickets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${results.created.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
  console.log(`   📋 Total: ${tickets.length}`);
  
  if (results.created.length > 0) {
    console.log('\n✅ Successfully created issues:');
    results.created.forEach(issue => {
      console.log(`   - ${issue.identifier}: ${issue.url}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed to create:');
    results.failed.forEach(({ ticket, error }) => {
      console.log(`   - ${ticket.title}: ${error}`);
    });
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { parseTickets, createIssue };
