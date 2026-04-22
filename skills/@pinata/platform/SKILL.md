---
name: pinata-platform
description: Self-service platform operations — manage skills, secrets, agents, tasks, channels, templates, config, and more. No setup required, all credentials are auto-injected.
homepage: https://pinata.cloud
metadata: {"openclaw": {"emoji": "🔧"}}
---

# pinata-platform

Platform self-service CLI for Pinata agents. Run commands to manage your skills, spin up agents, create secrets, schedule tasks, and more.

## Setup

No setup required. All credentials are automatically injected by the platform.

## Important Behaviors

When the user asks you to do any of the following, use the corresponding commands from this skill:

- **Open a port, expose a web app, make something publicly accessible, or set up routing** — use `open-port` to create a port forwarding rule. This maps an external path prefix to an internal container port so the app becomes reachable at `https://{agentId}.agents.pinata.cloud/{pathPrefix}`. Use `--protected=false` if the user wants the route publicly accessible without a gateway token.
- **Close or stop exposing a port** — use `close-port`.
- **List routes or check what ports are open** — use `list-routes`.
- **Install or add a skill** — browse ClawHub with `browse-hub`, then install with `install-hub <slug>`, attach with `attach <cid>`, and `restart` to activate it.
- **Create a skill** — write the skill files locally (a `skill.json` and a `SKILL.md` at minimum), then upload to the user's library. Skills can also be published to ClawHub via `submit-template`.
- **Create or submit a template** — use `submit-template <gitUrl>` to submit a public git repo as a template. Use `list-templates` to browse existing templates.
- **Create a secret or API key** — use `create-secret <name> <value>` to create an encrypted secret. Add `--attach` to immediately attach it to this agent. Use `--type=variable` for plaintext env vars. Always `restart` after attaching secrets so the container picks them up.
- **Attach an existing secret** — use `attach-secret <secretId>`, then `restart`.
- **Change the model or update agent config** — use `get-config` to read the current `openclaw.json`, modify the model in `agents.defaults.model.primary` (e.g. `anthropic/claude-sonnet-4-6`), then `set-config` with the updated JSON. No restart needed — config changes apply immediately.

## Usage

All commands output JSON. Replace `{baseDir}` with the skill's install directory.

```
node {baseDir}/cli.mjs <command> [args...]
node {baseDir}/cli.mjs help
```

## Commands

### Identity & Status

```bash
# Get your agent ID, name, status, user ID
node {baseDir}/cli.mjs whoami

# Check container health and status
node {baseDir}/cli.mjs status

# Update your name, description, emoji, or vibe
node {baseDir}/cli.mjs update-metadata --name="New Name" --emoji="🚀"

# Restart your container (e.g. after adding secrets/skills)
node {baseDir}/cli.mjs restart
```

### Skills

```bash
# List all skills in your user's library
node {baseDir}/cli.mjs list-library

# List skills currently attached to you
node {baseDir}/cli.mjs list-attached

# Browse ClawHub marketplace
node {baseDir}/cli.mjs browse-hub --q="web scraper"

# Get details for a specific skill
node {baseDir}/cli.mjs hub-detail <slug>

# Install a skill from ClawHub into your library
node {baseDir}/cli.mjs install-hub <slug>

# Attach skills to yourself (by CID from list-library)
node {baseDir}/cli.mjs attach <skillCid1> [skillCid2...]

# Detach a skill (by ID from list-attached)
node {baseDir}/cli.mjs detach <skillId>
```

### Secrets

```bash
# List available secrets (names only, values never exposed)
node {baseDir}/cli.mjs list-secrets

# Create an encrypted secret
node {baseDir}/cli.mjs create-secret MY_API_KEY sk-123abc

# Create a plaintext variable
node {baseDir}/cli.mjs create-secret DEBUG true --type=variable

# Create and immediately attach to yourself
node {baseDir}/cli.mjs create-secret OPENAI_API_KEY sk-xxx --attach

# Attach existing secrets to this agent (by ID from list-secrets)
node {baseDir}/cli.mjs attach-secret <secretId1> [secretId2...]

# Detach a secret from this agent
node {baseDir}/cli.mjs detach-secret <secretId>
```

### Tasks (Cron)

```bash
# List scheduled tasks
node {baseDir}/cli.mjs list-tasks

# Create a recurring task (runs every 6 hours)
node {baseDir}/cli.mjs create-task "Check news" --every="6h" --prompt="Search for AI news and summarize"

# Create a one-shot task (runs at a specific time)
node {baseDir}/cli.mjs create-task "Reminder" --at="2026-04-10T09:00:00Z" --prompt="Remind user about meeting"

# Create a cron-scheduled task
node {baseDir}/cli.mjs create-task "Daily digest" --cron="0 9 * * *" --prompt="Generate daily summary"

# Update an existing task
node {baseDir}/cli.mjs update-task <jobId> --prompt="New prompt" --every="12h"

# Run a task immediately
node {baseDir}/cli.mjs run-task <jobId>

# Enable/disable a task
node {baseDir}/cli.mjs toggle-task <jobId>

# Delete a task
node {baseDir}/cli.mjs delete-task <jobId>
```

Duration formats for `--every`: `30s`, `5m`, `6h`, `1d`, or raw milliseconds.

### Config

```bash
# Read current openclaw.json
node {baseDir}/cli.mjs get-config

# Write config (pass full JSON)
node {baseDir}/cli.mjs set-config '{"agents":{"defaults":{"model":{"primary":"anthropic/claude-sonnet-4-6"}}}}'
```

### Console

```bash
# Execute a shell command in your container
node {baseDir}/cli.mjs exec "ls -la /home/node/clawd"
node {baseDir}/cli.mjs exec "cat /home/node/.openclaw/openclaw.json"
```

### Routes (Port Forwarding)

```bash
# List current port forwarding rules
node {baseDir}/cli.mjs list-routes

# Open a port — maps a path prefix to a container port
node {baseDir}/cli.mjs open-port 3000 /app

# Open an unprotected port (no gateway token required)
node {baseDir}/cli.mjs open-port 8080 /public --protected=false

# Close a port by path prefix
node {baseDir}/cli.mjs close-port /app
```

Port rules map external path prefixes to internal container ports. Ports 0-1023 and 18789 (gateway) are reserved. Max 10 rules per agent.

### Channels

```bash
# List connected channels (Telegram, Discord, etc.)
node {baseDir}/cli.mjs list-channels

# Add a Telegram channel
node {baseDir}/cli.mjs add-channel telegram '{"botToken":"123456:ABC..."}'

# Add a Discord channel
node {baseDir}/cli.mjs add-channel discord '{"webhookUrl":"https://discord.com/api/webhooks/..."}'

# Remove a channel
node {baseDir}/cli.mjs remove-channel telegram
```

### Agents

```bash
# List all agents belonging to your user
node {baseDir}/cli.mjs list-agents

# Create a new agent
node {baseDir}/cli.mjs create-agent "My New Agent"

# Create with options
node {baseDir}/cli.mjs create-agent "Research Bot" --description="Researches topics" --emoji="🔬"

# Create from a template
node {baseDir}/cli.mjs create-agent "Web App" --templateId=<uuid>
```

### Templates

```bash
# Browse published templates
node {baseDir}/cli.mjs list-templates

# Filter by category
node {baseDir}/cli.mjs list-templates --category=productivity

# Submit a template from a public git repo
node {baseDir}/cli.mjs submit-template https://github.com/user/my-template

# Submit from a specific branch or subdirectory
node {baseDir}/cli.mjs submit-template https://github.com/user/repo --branch=dev --path=agents/my-template
```

### Platform Token

```bash
# Get a short-lived JWT (1h) for audit trails
node {baseDir}/cli.mjs get-token
```

## Workflows

### Install a skill and activate it

```bash
node {baseDir}/cli.mjs browse-hub --q="web scraper"
node {baseDir}/cli.mjs install-hub web-scraper
node {baseDir}/cli.mjs attach web-scraper
node {baseDir}/cli.mjs restart    # reload to pick up new skill
```

### Create a secret and use it

```bash
node {baseDir}/cli.mjs create-secret ANTHROPIC_API_KEY sk-ant-xxx --attach
node {baseDir}/cli.mjs restart    # reload to inject new env var
```

### Spin up another agent

```bash
node {baseDir}/cli.mjs list-templates
node {baseDir}/cli.mjs create-agent "Helper Bot" --emoji="🤖" --templateId=<uuid>
# returns agentId + gatewayToken for the new agent
```

### Schedule recurring work

```bash
node {baseDir}/cli.mjs create-task "Check news" --every="6h" --prompt="Search for AI news and summarize"
node {baseDir}/cli.mjs list-tasks
```

### Expose a web app

```bash
# Start your app on port 3000, then expose it
node {baseDir}/cli.mjs open-port 3000 /app
# Access at https://{agentId}.agents.pinata.cloud/app
```

### Check everything

```bash
node {baseDir}/cli.mjs whoami           # who am I
node {baseDir}/cli.mjs status           # container health
node {baseDir}/cli.mjs list-attached    # my skills
node {baseDir}/cli.mjs list-secrets     # available credentials
node {baseDir}/cli.mjs list-tasks       # scheduled work
node {baseDir}/cli.mjs list-channels    # connected channels
node {baseDir}/cli.mjs list-agents      # all user's agents
node {baseDir}/cli.mjs list-routes      # port forwarding rules
```
