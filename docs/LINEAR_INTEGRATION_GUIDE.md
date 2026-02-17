# Linear Integration Guide for FlipMyEra

This guide explains how to connect FlipMyEra to Linear for issue tracking and project management.

## Option 1: Linear MCP Server (Recommended for Cursor)

Linear provides an MCP (Model Context Protocol) server that integrates directly with Cursor, allowing AI assistants to create and manage Linear issues.

### Setup Instructions

1. **Open Cursor Settings**
   - Press `CMD/CTRL + Shift + J` (or `CMD/CTRL + ,` then search for "MCP")

2. **Add Linear MCP Server**
   - Navigate to MCP settings
   - Add a new global MCP server with this configuration:

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/sse"]
    }
  }
}
```

3. **Authenticate**
   - When first used, Linear MCP will prompt you to authenticate
   - Follow the authentication flow in your browser
   - Grant necessary permissions

4. **Verify Connection**
   - Restart Cursor if needed
   - The AI assistant should now be able to create Linear issues directly

### Using Linear MCP

Once configured, you can ask the AI assistant to:
- "Create a Linear issue for [description]"
- "List open Linear issues"
- "Update Linear issue [ID]"
- "Create tickets from LINEAR_TICKETS.md"

**Note:** Remote MCP connections may require multiple attempts. If issues persist, try restarting Cursor or re-enabling the Linear MCP server.

---

## Option 2: Linear CLI

The Linear CLI allows you to create and manage issues from the command line.

### Installation

**Option A: Homebrew (macOS)**
```bash
brew install schpet/tap/linear
```

**Option B: Deno**
```bash
deno install -A --reload -f -g -n linear jsr:@schpet/linear-cli
```

### Configuration

1. **Create API Key**
   - Go to Linear Settings → API
   - Create a new API key
   - Copy the key (starts with `lin_api_...`)

2. **Set Environment Variable**
   ```bash
   export LINEAR_API_KEY="lin_api_your_key_here"
   ```
   
   Or add to your shell profile (`~/.zshrc` or `~/.bashrc`):
   ```bash
   echo 'export LINEAR_API_KEY="lin_api_your_key_here"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Configure Project**
   ```bash
   linear config
   ```
   
   This will:
   - Prompt you to select your Linear workspace
   - Select your team
   - Create a `.linear.toml` config file in your repository

### Usage Examples

**Create a new issue:**
```bash
linear issue create
```

**Create issue with details:**
```bash
linear issue create \
  --title "Fix memory leak in ClerkAuthContext" \
  --description "Add cleanup function to useEffect hook" \
  --priority "Critical" \
  --label "bug,memory-leak,auth"
```

**List issues:**
```bash
linear issues list
```

**View specific issue:**
```bash
linear issue view ISSUE-123
```

---

## Option 3: Linear API (Programmatic)

Use the Linear GraphQL API to create issues programmatically. A helper script is provided below.

### Setup

1. **Create API Key** (same as CLI setup)
   - Go to Linear Settings → API
   - Create a new API key

2. **Set Environment Variable**
   ```bash
   export LINEAR_API_KEY="lin_api_your_key_here"
   ```

3. **Get Your Team ID**
   - Go to Linear → Settings → Teams
   - Copy the Team ID (or use GraphQL query to find it)

### GraphQL Endpoint

- **URL:** `https://api.linear.app/graphql`
- **Method:** POST
- **Headers:**
  ```
  Authorization: Bearer lin_api_your_key_here
  Content-Type: application/json
  ```

### Example GraphQL Mutation

```graphql
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
```

**Variables:**
```json
{
  "input": {
    "teamId": "your-team-id",
    "title": "Fix memory leak in ClerkAuthContext",
    "description": "Add cleanup function to useEffect hook...",
    "priority": 1,
    "labelIds": ["label-id-1", "label-id-2"]
  }
}
```

---

## Helper Script: Import Tickets from LINEAR_TICKETS.md

A Node.js script is provided to help import tickets from `LINEAR_TICKETS.md`:

```bash
# Install dependencies (if needed)
npm install

# Run the import script
node scripts/import-linear-tickets.js
```

**Note:** The script requires:
- `LINEAR_API_KEY` environment variable
- `.linear.toml` config file (created by `linear config`)
- Or manual team/project IDs

---

## Quick Start Checklist

- [ ] Choose integration method (MCP recommended for Cursor)
- [ ] Set up Linear API key
- [ ] Configure workspace/team
- [ ] Test connection (create a test issue)
- [ ] Import tickets from `LINEAR_TICKETS.md`
- [ ] Set up project labels (bug, feature, p0, p1, p2, p3, etc.)

---

## Troubleshooting

### MCP Connection Issues
- Restart Cursor
- Re-enable Linear MCP server
- Check authentication status
- Verify network connectivity

### CLI Issues
- Verify `LINEAR_API_KEY` is set: `echo $LINEAR_API_KEY`
- Check `.linear.toml` exists and is valid
- Verify API key permissions

### API Issues
- Verify API key is valid
- Check team/project IDs are correct
- Review GraphQL query syntax
- Check Linear API status: https://status.linear.app

---

## Resources

- **Linear MCP Docs:** https://linear.app/docs/mcp
- **Linear CLI Docs:** https://github.com/schpet/linear-cli
- **Linear API Docs:** https://linear.app/docs/api
- **Linear GraphQL Explorer:** https://linear.app/settings/api (use GraphQL Explorer)

---

## Next Steps

1. Set up Linear integration using one of the methods above
2. Review `LINEAR_TICKETS.md` for all outstanding issues
3. Import tickets into Linear (manually or via script)
4. Start working through P0 (Critical) tickets first
5. Set up project labels and workflows in Linear

