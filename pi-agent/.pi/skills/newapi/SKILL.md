---
name: newapi
description: Manage and explain New API resources. Use when the user asks about available models, groups, account quota, request statistics, or API tokens in the New API platform.
---

# New API Platform Assistant

This skill integrates with [New API](https://github.com/QuantumNous/new-api) and
is adapted from [QuantumNous/skills](https://github.com/QuantumNous/skills).

## Available actions

- Use `newapi_list_models` for available models. Pass the requested group when known.
- Use `newapi_list_groups` for groups and ratios.
- Use `newapi_get_account` for account balance, profile, group, and request count.
- Use `newapi_list_tokens` for token metadata.

## Rules

1. Use a tool instead of guessing current platform data.
2. Only query the current authenticated user's resources.
3. Never claim that a write operation succeeded. This version is read-only.
4. Never reveal, reconstruct, or request a full API key.
5. Summarize tool output in concise Chinese unless the user asks for raw data.
6. Explain that quota values are platform quota units when the response does not
   contain an explicit display currency.
