---
name: GitHub push authentication
description: The workspace may have a GitHub origin without CLI credentials even when the managed GitHub integration can push.
---

When a normal `git push` fails with an authentication error, use the managed GitHub push integration instead of requesting or handling a token.

**Why:** Replit can have GitHub access through its managed integration while the shell's Git credential helper remains unauthenticated.

**How to apply:** Keep the local commit, do not change secrets or remote configuration, and retry the push through the managed GitHub operation.