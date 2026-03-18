# Agent Memory — Docker Desktop Extension

Shared offline memory for AI agents, powered by [Hindsight](https://github.com/vectorize-io/hindsight).

Give every AI agent (Claude, Cursor, VS Code Copilot, custom agents) a persistent, searchable memory that works entirely offline — no cloud required.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Docker Desktop                      │
│                                                      │
│  ┌──────────────┐    ┌─────────────────────────────┐ │
│  │   React UI   │───▶│    Go Backend (Unix Socket)  │ │
│  │  (Status,    │    │    Proxies to Hindsight API  │ │
│  │  Config,     │    └──────────┬──────────────────┘ │
│  │  Browse)     │               │                    │
│  └──────────────┘               ▼                    │
│                     ┌─────────────────────────────┐  │
│                     │   Hindsight Container        │  │
│                     │   ┌───────────┐ ┌─────────┐ │  │
│                     │   │ MCP Server│ │Embedded │ │  │
│                     │   │ :8888     │ │Postgres │ │  │
│                     │   └───────────┘ └─────────┘ │  │
│                     │   ┌───────────┐             │  │
│                     │   │ Web UI    │             │  │
│                     │   │ :9999     │             │  │
│                     │   └───────────┘             │  │
│                     └─────────────────────────────┘  │
└──────────────────────────────────────┬───────────────┘
                                       │ ports 8888, 9999
                    ┌──────────────────▼──────────────────┐
                    │         AI Agents (MCP Clients)      │
                    │  Claude Code  │ Cursor │ VS Code     │
                    │  Custom Agent │ Docker MCP Gateway    │
                    └─────────────────────────────────────┘
```

## Features

- **Offline-first**: Core memory operations (retain + recall) work without any LLM
- **MCP-native**: Agents connect via standard HTTP MCP protocol
- **Multi-bank**: Organize memories by project, agent, or topic
- **Persistent**: Memories survive container restarts via Docker volumes
- **Docker MCP Gateway**: Compatible with `docker mcp gateway connect`
- **Optional LLM**: Add Ollama, OpenAI, or Anthropic for fact extraction

## Quick Start

### Build & Install

```bash
make install
```

This builds the extension image and installs it into Docker Desktop.

### Connect an Agent

Once installed, agents can connect to:

```
http://localhost:8888/mcp/{bank_id}/
```

Replace `{bank_id}` with a memory bank name (e.g., `default`, `my-project`).

## Agent Configuration

### Claude Desktop / Claude Code

Add to `claude_desktop_config.json` or `.mcp.json`:

```json
{
  "mcpServers": {
    "agent-memory": {
      "url": "http://localhost:8888/mcp/default/"
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agent-memory": {
      "type": "http",
      "url": "http://localhost:8888/mcp/default/"
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "agent-memory": {
      "type": "http",
      "url": "http://localhost:8888/mcp/default/"
    }
  }
}
```

### Docker MCP Gateway

```bash
docker mcp gateway connect agent-memory http://localhost:8888/mcp/default/
```

## Memory Operations

### Retain (Store)

Without an LLM, use `verbatim` or `chunks` strategy:

```json
{
  "strategy": "verbatim",
  "content": "The API rate limit is 100 requests per minute per user."
}
```

The `verbatim` strategy stores text exactly as provided. The `chunks` strategy splits longer text into overlapping segments for better search coverage.

With an LLM configured, `extract` strategy uses the model to identify discrete facts.

### Recall (Search)

Recall uses local embeddings — no LLM needed:

```json
{
  "query": "rate limit",
  "n": 5
}
```

## Configuration

### LLM Providers (Optional)

The extension works fully offline. LLM is only needed for:
- `extract` retain strategy (fact extraction)
- `reflect` operation (memory consolidation)

Supported providers:
| Provider | Value | Notes |
|----------|-------|-------|
| None | `none` | Default, offline mode |
| Ollama | `ollama` | Local, set base_url to `http://host.docker.internal:11434` |
| OpenAI | `openai` | Requires API key |
| Anthropic | `anthropic` | Requires API key |
| OpenAI-compatible | `openai-compatible` | Any compatible API |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `none` | LLM provider |
| `LLM_MODEL` | `` | Model name |
| `LLM_API_KEY` | `` | API key |
| `LLM_BASE_URL` | `` | Base URL for Ollama / compatible APIs |
| `LLM_MAX_CONCURRENT` | `1` | Max concurrent LLM requests |
| `ENABLE_OBSERVATIONS` | `false` | Auto-observe agent interactions |

## API Reference

The Go backend proxy exposes these endpoints via Unix socket:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (Hindsight status) |
| `GET` | `/status` | Full status with bank counts |
| `GET` | `/banks` | List all memory banks |
| `POST` | `/banks` | Create a memory bank |
| `GET` | `/banks/{id}` | Get bank details |
| `POST` | `/retain` | Store a memory |
| `POST` | `/recall` | Search memories |
| `GET` | `/config` | Get current configuration |
| `POST` | `/config` | Update configuration |

Agents connect directly to Hindsight's MCP endpoint at `http://localhost:8888/mcp/{bank_id}/`.

## Development

### Dev Mode (live UI reload)

```bash
make dev
```

### Debug

```bash
make debug
```

### Validate Extension

```bash
make validate
```

### Rebuild & Update

```bash
make update
```

### Remove

```bash
make remove
```

## Why Hindsight?

Hindsight was selected as the memory engine after evaluating several alternatives:

| Option | Pros | Cons |
|--------|------|------|
| **Hindsight** | MCP-native, embedded Postgres, local embeddings, no LLM needed | Newer project |
| mem0 | Popular, multi-provider | Requires external Postgres + Qdrant |
| Zep | Good MCP support | Requires multiple containers |
| ChromaDB | Simple embedding store | No MCP, not agent-oriented |
| Custom (Postgres + pgvector) | Full control | Significant development effort |

Hindsight was chosen because it:
1. Ships as a single container with embedded Postgres
2. Has native MCP server support
3. Uses local embeddings for recall (no LLM required)
4. Supports verbatim/chunks retain strategies without LLM
5. Maps cleanly to Docker Extension architecture

## Ports

| Port | Service | Description |
|------|---------|-------------|
| 8888 | Hindsight API + MCP | Agent connections, REST API |
| 9999 | Hindsight Web UI | Built-in browser interface |

## License

MIT
