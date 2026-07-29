---
name: newapi
description: Manage and explain New API resources. Use automatically when the user asks about platform state or requests an operation involving models, groups, accounts, keys, channels, users, settings, monitoring, or other New API resources.
---

# New API Platform Assistant

This skill integrates with [New API](https://github.com/QuantumNous/new-api) and
is adapted from [QuantumNous/skills](https://github.com/QuantumNous/skills).

## Available actions

- Use `newapi_list_models` for available models. Pass the requested group when known.
- Use `newapi_list_groups` for groups and ratios.
- Use `newapi_get_account` for account balance, profile, group, and request count.
- Use `newapi_list_tokens` for token metadata.
- Use `newapi_api_request` for other `/api/` queries and management operations.

## Rules

1. Use a tool instead of guessing current platform data.
2. Every operation inherits the current authenticated user's backend RBAC. Root
   users can access root routes; other users remain limited to their own role.
3. Only perform writes that the user explicitly requested. Before destructive
   actions, summarize the exact target and impact, then wait for confirmation.
4. Never reveal, reconstruct, or request a full API key.
5. Summarize tool output in concise Chinese unless the user asks for raw data.
6. Explain that quota values are platform quota units when the response does not
   contain an explicit display currency.
