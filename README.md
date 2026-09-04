<div align="center">

<img src="public/logo.png" alt="TaskMax Logo" width="120" />

# TaskMax

A full-stack task manager with built-in MCP server for Claude Desktop integration.

**[Live Demo](https://taskmax.vercel.app)**

</div>

---

## Features

- **Full task management** — sub-tasks, sections, labels, comments, recurring dates
- **Projects** — organize tasks across multiple projects with sidebar navigation
- **Drag and drop** — reorder tasks with @dnd-kit
- **Stats page** — productivity trends and AI-ready data
- **Email reports** — automated summaries via Resend
- **Calendar export** — sync tasks to your calendar (iCal)
- **Keyboard shortcuts** — navigate without touching the mouse
- **Dark mode** — toggle between light and dark themes
- **MCP server** — Claude Desktop can read, create, update, and delete your tasks directly

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| AI Integration | Model Context Protocol (MCP) SDK |
| Testing | Vitest |
| Design System | Soft Tactility (DM Sans, sage green palette) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account (auth)
- A [Supabase](https://supabase.com) project (database)
- A [Resend](https://resend.com) API key (email)

### Installation

```bash
git clone https://github.com/Ibra106i/Taskmax.git
cd Taskmax
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Resend
RESEND_API_KEY=re_...

# MCP API Key (for Claude Desktop integration)
MCP_API_KEY=tk_your_api_key_here
```

### Database Setup

Run the SQL migrations in your Supabase dashboard or via the Supabase CLI to create the `todos`, `projects`, `labels`, `todo_labels`, `comments`, `sections`, `api_keys`, and `rate_limits` tables.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## MCP Integration

TaskMax includes a built-in MCP server. Connect Claude Desktop to manage your tasks through natural language.

### Claude Desktop Config

Add to your Claude Desktop config file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "taskmax": {
      "url": "https://taskmax.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer tk_your_api_key_here"
      }
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `list_todos` | List all todos with optional filters (project, label, completed) |
| `get_todo` | Get a single todo by ID |
| `create_todo` | Create a new todo with optional project, labels, due date |
| `update_todo` | Update title, description, due date, or project |
| `delete_todo` | Delete a todo |
| `toggle_todo` | Toggle completed status |
| `list_projects` | List all projects |
| `list_labels` | List all labels |
| `search_todos` | Full-text search across todos |

### API Key Management

Generate API keys in the Settings page. Keys are HMAC-SHA256 hashed before storage — the raw key is shown once at creation and cannot be recovered.

Rate limits: 60 requests per minute per API key, enforced via atomic PostgreSQL functions.

## Security

- **HMAC-SHA256** — API keys hashed with Supabase service role key before storage
- **Atomic rate limiting** — PostgreSQL function prevents TOCTOU races
- **IDOR protection** — all queries scoped to authenticated user, cross-user access tested
- **Row-Level Security** — Supabase RLS policies on all tables
- **Timing-safe comparison** — prevents timing attacks on key verification
- **Security headers** — nosniff, DENY frame, no-store cache, no-referrer on MCP endpoint

## Testing

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
```

23 tests covering crypto primitives, rate limiting, HMAC verification, and cross-user IDOR protection.

## Project Structure

```
src/
  app/
    api/mcp/          # MCP server endpoint
    login/            # Clerk sign-in
    signup/           # Clerk sign-up
    settings/         # API key management
    stats/            # Productivity stats
    page.tsx          # Main todo list
  components/
    TodoList.tsx      # Main task list
    TodoItem.tsx      # Individual task
    ProjectSidebar.tsx # Project navigation
    LabelPicker.tsx   # Label assignment
    CommentSection.tsx # Task comments
    Section.tsx       # Task sections
    ApiKeyManager.tsx # API key CRUD
    Spinner.tsx       # Loading indicator
    ...
  lib/
    mcp/
      server.ts       # MCP server setup
      auth.ts         # HMAC auth + rate limiting
      crypto.ts       # Hashing utilities
      tools/          # 9 MCP tool definitions
supabase/
  migrations/         # SQL schema + functions
```

## License

MIT
