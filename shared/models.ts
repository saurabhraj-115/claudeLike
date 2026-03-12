export const CLAUDE_MODEL_IDS = [
  "claude-sonnet-4-20250514",
  "claude-opus-4-1-20250805",
  "claude-opus-4-20250514",
  "claude-3-7-sonnet-20250219",
  "claude-3-5-haiku-20241022",
] as const;

export type ClaudeModelId = (typeof CLAUDE_MODEL_IDS)[number];

export const DEFAULT_MODEL: ClaudeModelId = "claude-sonnet-4-20250514";

export const CLAUDE_MODELS: { value: ClaudeModelId; label: string }[] = [
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-opus-4-1-20250805", label: "Claude Opus 4.1" },
  { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
  { value: "claude-3-7-sonnet-20250219", label: "Claude Sonnet 3.7" },
  { value: "claude-3-5-haiku-20241022", label: "Claude Haiku 3.5" },
];
