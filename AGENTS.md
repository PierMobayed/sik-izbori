# Agent instructions (fleet pointer)

Fleet rules are **not** duplicated in this file.

1. Loading chain: https://github.com/PierMobayed/repo-rules/blob/main/common/rules-loading.md (fleet repo-rules; see PR #44 until merged).
2. Role prompts: `.repo-rules/cursor/roles/<role>.md` (lowercase role name) when the user opens with `Ти си <Роля>`.
3. Shared policy: `.repo-rules/common/`
4. Project snapshot: `docs/STATUS.md` when present.

Sync committed `.repo-rules/` from https://github.com/PierMobayed/repo-rules — do not `git pull` inside `.repo-rules/`.
