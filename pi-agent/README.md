# Zhiqing Pi Agent

Independent web agent service built with
[`earendil-works/pi`](https://github.com/earendil-works/pi). It connects to an
OpenAI-compatible New API endpoint and exposes a read-only New API Skill for the
platform Playground.

## Run locally

```bash
cp .env.example .env
bun install
bun run start
```

Required configuration:

- `NEWAPI_BASE_URL`: New API origin, for example `http://127.0.0.1:7992`.
- `NEWAPI_API_KEY`: API key used only for the Pi model request.
- `NEWAPI_MODEL`: tool-capable model available through New API.
- `NEWAPI_GROUP`: routing group for the model request.

The browser user's New API session is forwarded separately for Skill queries;
the model API key is never returned to the browser.

## API

- `GET /health`
- `POST /v1/chat/completions`
- `DELETE /v1/sessions/:id`

`POST /v1/chat/completions` accepts OpenAI-style `messages`, `stream`, and a
stable `session_id`. Streaming responses use OpenAI-compatible SSE chunks.
