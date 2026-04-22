#!/usr/bin/env node

/**
 * CLI wrapper for @pinata/platform skill.
 *
 * Uses two authentication modes:
 *   1. Gateway token → agent subdomain (/v0/platform/*, /v0/tasks, /v0/config, etc.)
 *   2. Platform JWT  → management domain (/v0/agents, /v0/secrets, /v0/skills, etc.)
 *
 * The platform JWT is auto-obtained on the first management-domain call.
 *
 * Run `node cli.mjs help` for full command list.
 */

const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;
const AGENT_ID = process.env.AGENT_ID;
const AGENTS_API_URL = process.env.AGENTS_API_URL || "https://agents.pinata.cloud";

let _platformToken = null;

function headers(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** Agent subdomain base: {AGENT_ID}.agents.pinata.cloud */
function agentOrigin() {
  if (!AGENT_ID) { console.error("Error: AGENT_ID is not set"); process.exit(1); }
  const url = new URL(AGENTS_API_URL);
  url.hostname = `${AGENT_ID}.${url.hostname}`;
  return url.origin;
}

/** Management domain base: agents.pinata.cloud */
function mgmtOrigin() {
  return new URL(AGENTS_API_URL).origin;
}

async function call(url, method, body, token) {
  const opts = { method, headers: headers(token) };
  if (body) opts.body = JSON.stringify(body);
  const response = await fetch(url, opts);
  const text = await response.text();
  if (!response.ok) { console.error(`Error ${response.status}: ${text}`); process.exit(1); }
  try { return JSON.parse(text); } catch { return text; }
}

/** Call per-agent API (gateway token auth, agent subdomain) */
async function agentApi(path, method = "GET", body) {
  if (!GATEWAY_TOKEN) { console.error("Error: OPENCLAW_GATEWAY_TOKEN is not set"); process.exit(1); }
  return call(`${agentOrigin()}/v0${path}`, method, body, GATEWAY_TOKEN);
}

/** Call management API (platform JWT auth, management domain) */
async function mgmtApi(path, method = "GET", body) {
  if (!_platformToken) {
    const res = await agentApi("/platform/token", "POST");
    _platformToken = res.token;
  }
  return call(`${mgmtOrigin()}${path}`, method, body, _platformToken);
}

/** Parse a human duration string (e.g. "6h", "30m", "1d", "90s") to milliseconds. */
function parseDuration(str) {
  const m = str.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)$/i);
  if (!m) {
    // Try as raw milliseconds
    const n = Number(str);
    if (!isNaN(n)) return n;
    console.error(`Invalid duration: "${str}". Use e.g. "30m", "6h", "1d", "90s"`);
    process.exit(1);
  }
  const val = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  const multipliers = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Math.round(val * multipliers[unit]);
}

function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (const arg of args) {
    const m = arg.match(/^--(\w[\w-]*)(?:=(.*))?$/);
    if (m) { flags[m[1]] = m[2] !== undefined ? m[2] : true; }
    else { positional.push(arg); }
  }
  return { flags, positional };
}

const HELP = `
Pinata Platform CLI — self-service commands for agents.

Usage: node cli.mjs <command> [args...]

Identity & Status:
  whoami                                  Get agent identity
  status                                  Check agent health
  update-metadata [--name=...] [--description=...] [--emoji=...] [--vibe=...]
                                          Update this agent's metadata
  restart                                 Restart container (e.g. after adding skills/secrets)

Skills:
  list-library                            List user's skill library
  list-attached                           List skills attached to this agent
  browse-hub [--q=...] [--category=...]   Browse ClawHub marketplace
  hub-detail <slug>                       Get ClawHub skill details
  install-hub <slug>                      Install a ClawHub skill to library
  attach <cid1> [cid2...]                 Attach skills to this agent
  detach <skillId>                        Detach a skill from this agent

Secrets:
  list-secrets                            List available secrets (names only)
  create-secret <name> <value> [--type=secret|variable] [--attach]
                                          Create a new secret (--attach to also attach to self)
  attach-secret <secretId1> [secretId2...]
                                          Attach existing secrets to this agent
  detach-secret <secretId>                Detach a secret from this agent

Tasks (Cron):
  list-tasks                              List scheduled tasks
  create-task <name> [--every=...] [--at=...] [--cron=...] [--prompt=...]
                                          Create a scheduled task
  update-task <jobId> [--name=...] [--prompt=...] [--every=...] [--at=...] [--cron=...]
                                          Update a scheduled task
  delete-task <jobId>                     Delete a scheduled task
  run-task <jobId>                        Execute a task immediately
  toggle-task <jobId>                     Enable/disable a task

Routes (Port Forwarding):
  list-routes                             List port forwarding rules
  open-port <port> <pathPrefix> [--protected=true|false]
                                          Open a port (map path to container port)
  close-port <pathPrefix>                 Close a port (remove rule by path prefix)

Config:
  get-config                              Read openclaw.json config
  set-config <json>                       Write openclaw.json config

Console:
  exec <command>                          Execute a shell command

Channels:
  list-channels                           List connected channels
  add-channel <type> '<configJson>'       Add a channel (type: telegram, discord, slack, whatsapp)
  remove-channel <type>                   Remove a channel

Agents:
  list-agents                             List user's agents
  create-agent <name> [--description=...] [--emoji=...] [--templateId=...]
                                          Create a new agent

Templates:
  list-templates [--category=...]         Browse published templates
  submit-template <gitUrl> [--branch=...] [--path=...]
                                          Submit a template from a git repo

Other:
  get-token                               Get a short-lived platform JWT (1h)
  help                                    Show this help
`.trim();

const [command, ...rest] = process.argv.slice(2);
const { flags, positional } = parseFlags(rest);

async function main() {
  let result;

  switch (command) {
    // ── Identity & Status (agent subdomain) ────────────────────────────
    case "whoami":
      result = await agentApi("/platform/whoami");
      break;

    case "status":
      result = await agentApi("/status");
      break;

    case "update-metadata": {
      const body = {};
      if (flags.name) body.name = flags.name;
      if (flags.description) body.description = flags.description;
      if (flags.vibe) body.vibe = flags.vibe;
      if (flags.emoji) body.emoji = flags.emoji;
      if (Object.keys(body).length === 0) { console.error("Usage: update-metadata --name=... --description=... --emoji=... --vibe=..."); process.exit(1); }
      result = await agentApi("/platform/metadata", "PATCH", body);
      break;
    }

    case "restart":
      result = await agentApi("/restart", "POST");
      break;

    // ── Skills (mixed: agent subdomain + management domain) ────────────
    case "list-library":
      result = await mgmtApi("/v0/skills");
      break;

    case "list-attached":
      result = await agentApi("/platform/skills/attached");
      break;

    case "browse-hub": {
      const params = new URLSearchParams();
      if (flags.q) params.append("q", flags.q);
      if (flags.category) params.append("category", flags.category);
      if (flags.cursor) params.append("cursor", flags.cursor);
      const qs = params.toString();
      result = await mgmtApi(`/v0/clawhub${qs ? `?${qs}` : ""}`);
      break;
    }

    case "hub-detail": {
      const slug = positional[0] || flags.slug;
      if (!slug) { console.error("Usage: hub-detail <slug>"); process.exit(1); }
      result = await mgmtApi(`/v0/clawhub/${encodeURIComponent(slug)}`);
      break;
    }

    case "install-hub": {
      const slug = positional[0] || flags.slug;
      if (!slug) { console.error("Usage: install-hub <slug>"); process.exit(1); }
      // Hub install uses hubSkillId, but we have slug. Look up the skill first.
      const detail = await mgmtApi(`/v0/clawhub/${encodeURIComponent(slug)}`);
      const hubSkillId = detail?.skill?.hubSkillId || detail?.communitySkill?._id;
      if (!hubSkillId) { console.error(`Skill "${slug}" not found on ClawHub`); process.exit(1); }
      result = await mgmtApi(`/v0/clawhub/${encodeURIComponent(hubSkillId)}/install`, "POST");
      break;
    }

    case "attach": {
      const cids = positional.length > 0 ? positional : (flags.cids ? flags.cids.split(",") : []);
      if (cids.length === 0) { console.error("Usage: attach <cid1> [cid2...]"); process.exit(1); }
      result = await agentApi("/skills", "POST", { skillCids: cids });
      break;
    }

    case "detach": {
      const skillId = positional[0] || flags.skillId;
      if (!skillId) { console.error("Usage: detach <skillId>"); process.exit(1); }
      result = await agentApi(`/skills/${encodeURIComponent(skillId)}`, "DELETE");
      break;
    }

    // ── Secrets (mixed) ────────────────────────────────────────────────
    case "list-secrets":
      result = await mgmtApi("/v0/secrets");
      break;

    case "create-secret": {
      const name = positional[0];
      const value = positional[1];
      if (!name || !value) { console.error("Usage: create-secret <name> <value> [--type=secret|variable] [--attach]"); process.exit(1); }
      const created = await mgmtApi("/v0/secrets", "POST", { name, value, type: flags.type || "secret" });
      // Response is { success, secret: { id, name, ... } }
      const secretId = created?.secret?.id;
      // If --attach, also attach the new secret to this agent
      if (flags.attach && secretId) {
        await agentApi("/secrets", "POST", { secretIds: [secretId] });
        result = { ...created, attached: true };
      } else {
        result = created;
      }
      break;
    }

    case "attach-secret": {
      const ids = positional.length > 0 ? positional : (flags.ids ? flags.ids.split(",") : []);
      if (ids.length === 0) { console.error("Usage: attach-secret <secretId1> [secretId2...]"); process.exit(1); }
      result = await agentApi("/secrets", "POST", { secretIds: ids });
      break;
    }

    case "detach-secret": {
      const secretId = positional[0] || flags.secretId;
      if (!secretId) { console.error("Usage: detach-secret <secretId>"); process.exit(1); }
      result = await agentApi(`/secrets/${encodeURIComponent(secretId)}`, "DELETE");
      break;
    }

    // ── Tasks (management domain — tasks not mounted on per-agent subdomain) ─
    case "list-tasks":
      result = await mgmtApi(`/v0/agents/${AGENT_ID}/tasks`);
      break;

    case "create-task": {
      const name = positional[0] || flags.name;
      if (!name) { console.error("Usage: create-task <name> [--every=...] [--at=...] [--cron=...] [--prompt=...]"); process.exit(1); }
      // Build the schedule object from flags
      const schedule = {};
      if (flags.every) {
        schedule.kind = "every";
        schedule.everyMs = parseDuration(flags.every);
      } else if (flags.at) {
        schedule.kind = "at";
        schedule.at = flags.at;
      } else if (flags.cron) {
        schedule.kind = "cron";
        schedule.expr = flags.cron;
      }
      if (flags.tz) schedule.tz = flags.tz;
      // Build payload
      const payload = { kind: "agentTurn" };
      if (flags.prompt) payload.text = flags.prompt;
      const body = { name, payload };
      if (schedule.kind) body.schedule = schedule;
      if (flags.description) body.description = flags.description;
      result = await mgmtApi(`/v0/agents/${AGENT_ID}/tasks`, "POST", body);
      break;
    }

    case "update-task": {
      const jobId = positional[0] || flags.jobId;
      if (!jobId) { console.error("Usage: update-task <jobId> [--name=...] [--prompt=...] [--every=...] [--at=...] [--cron=...]"); process.exit(1); }
      const body = {};
      if (flags.name) body.name = flags.name;
      if (flags.description) body.description = flags.description;
      // Build schedule if any schedule flag is provided
      if (flags.every || flags.at || flags.cron) {
        const schedule = {};
        if (flags.every) { schedule.kind = "every"; schedule.everyMs = parseDuration(flags.every); }
        else if (flags.at) { schedule.kind = "at"; schedule.at = flags.at; }
        else if (flags.cron) { schedule.kind = "cron"; schedule.expr = flags.cron; }
        if (flags.tz) schedule.tz = flags.tz;
        body.schedule = schedule;
      }
      if (flags.prompt) body.payload = { kind: "agentTurn", text: flags.prompt };
      result = await mgmtApi(`/v0/agents/${AGENT_ID}/tasks/${encodeURIComponent(jobId)}`, "PUT", body);
      break;
    }

    case "delete-task": {
      const jobId = positional[0] || flags.jobId;
      if (!jobId) { console.error("Usage: delete-task <jobId>"); process.exit(1); }
      result = await mgmtApi(`/v0/agents/${AGENT_ID}/tasks/${encodeURIComponent(jobId)}`, "DELETE");
      break;
    }

    case "run-task": {
      const jobId = positional[0] || flags.jobId;
      if (!jobId) { console.error("Usage: run-task <jobId>"); process.exit(1); }
      result = await mgmtApi(`/v0/agents/${AGENT_ID}/tasks/${encodeURIComponent(jobId)}/run`, "POST");
      break;
    }

    case "toggle-task": {
      const jobId = positional[0] || flags.jobId;
      if (!jobId) { console.error("Usage: toggle-task <jobId>"); process.exit(1); }
      result = await mgmtApi(`/v0/agents/${AGENT_ID}/tasks/${encodeURIComponent(jobId)}/toggle`, "POST");
      break;
    }

    // ── Routes / Port Forwarding (agent subdomain) ────────────────────
    case "list-routes":
      result = await agentApi("/port-forwarding");
      break;

    case "open-port": {
      const port = parseInt(positional[0], 10);
      const pathPrefix = positional[1];
      if (!port || !pathPrefix) { console.error("Usage: open-port <port> <pathPrefix> [--protected=true|false]"); process.exit(1); }
      // GET current rules, upsert the new one, PUT back
      const current = await agentApi("/port-forwarding");
      const mappings = (current.mappings || []).filter(m => m.pathPrefix.toLowerCase() !== pathPrefix.toLowerCase());
      const entry = { port, pathPrefix };
      if (flags.protected !== undefined) entry.protected = flags.protected !== "false";
      mappings.push(entry);
      result = await agentApi("/port-forwarding", "PUT", { mappings });
      break;
    }

    case "close-port": {
      const pathPrefix = positional[0] || flags.pathPrefix;
      if (!pathPrefix) { console.error("Usage: close-port <pathPrefix>"); process.exit(1); }
      const current = await agentApi("/port-forwarding");
      const mappings = (current.mappings || []).filter(m => m.pathPrefix.toLowerCase() !== pathPrefix.toLowerCase());
      result = await agentApi("/port-forwarding", "PUT", { mappings });
      break;
    }

    // ── Config (agent subdomain) ───────────────────────────────────────
    case "get-config":
      result = await agentApi("/config");
      break;

    case "set-config": {
      const json = positional[0];
      if (!json) { console.error("Usage: set-config '<json>'"); process.exit(1); }
      // Validate it's valid JSON, then send as a string (route expects { config: string })
      try { JSON.parse(json); } catch { console.error("Invalid JSON"); process.exit(1); }
      result = await agentApi("/config", "PUT", { config: json });
      break;
    }

    // ── Console (agent subdomain) ──────────────────────────────────────
    case "exec": {
      const cmd = positional.join(" ");
      if (!cmd) { console.error("Usage: exec <command>"); process.exit(1); }
      result = await agentApi("/console/exec", "POST", { command: cmd });
      break;
    }

    // ── Channels (agent subdomain) ─────────────────────────────────────
    case "list-channels":
      result = await agentApi("/channels");
      break;

    case "add-channel": {
      const channel = positional[0];
      const json = positional[1] || flags.config;
      if (!channel) { console.error("Usage: add-channel <type> '<configJson>' (type: telegram, discord, slack, whatsapp)"); process.exit(1); }
      let config = {};
      if (json) {
        try { config = JSON.parse(json); } catch { console.error("Invalid JSON config"); process.exit(1); }
      }
      // Pass individual flags as config if no JSON provided
      if (!json) {
        if (flags.botToken) config.botToken = flags.botToken;
        if (flags.webhookUrl) config.webhookUrl = flags.webhookUrl;
        if (flags.token) config.token = flags.token;
      }
      result = await agentApi(`/channels/${encodeURIComponent(channel)}`, "POST", config);
      break;
    }

    case "remove-channel": {
      const channel = positional[0] || flags.channel;
      if (!channel) { console.error("Usage: remove-channel <type> (telegram, discord, slack, whatsapp)"); process.exit(1); }
      result = await agentApi(`/channels/${encodeURIComponent(channel)}`, "DELETE");
      break;
    }

    // ── Agents (management domain) ─────────────────────────────────────
    case "list-agents":
      result = await mgmtApi("/v0/agents");
      break;

    case "create-agent": {
      const name = positional[0];
      if (!name) { console.error("Usage: create-agent <name> [--description=...] [--emoji=...] [--templateId=...]"); process.exit(1); }
      const body = { name };
      if (flags.description) body.description = flags.description;
      if (flags.vibe) body.vibe = flags.vibe;
      if (flags.emoji) body.emoji = flags.emoji;
      if (flags.templateId) body.templateId = flags.templateId;
      result = await mgmtApi("/v0/agents", "POST", body);
      break;
    }

    // ── Templates (management domain) ──────────────────────────────────
    case "list-templates": {
      const params = new URLSearchParams();
      if (flags.category) params.append("category", flags.category);
      const qs = params.toString();
      result = await mgmtApi(`/v0/templates${qs ? `?${qs}` : ""}`);
      break;
    }

    case "submit-template": {
      const gitUrl = positional[0];
      if (!gitUrl) { console.error("Usage: submit-template <gitUrl> [--branch=...] [--path=...]"); process.exit(1); }
      const body = { gitUrl };
      if (flags.branch) body.branch = flags.branch;
      if (flags.path) body.path = flags.path;
      if (flags.name) body.nameOverride = flags.name;
      if (flags.slug) body.slugOverride = flags.slug;
      result = await mgmtApi("/v0/templates", "POST", body);
      break;
    }

    // ── Other ──────────────────────────────────────────────────────────
    case "get-token": {
      result = await agentApi("/platform/token", "POST");
      break;
    }

    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      return;

    default:
      console.error(`Unknown command: ${command || "(none)"}\n`);
      console.log(HELP);
      process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
