# I Asked Claude Code to Investigate Its Own $197 Session

What happens when you point an AI coding assistant at its own usage logs and say "figure out why this cost so much"? You get a surprisingly thorough post-mortem — written by the thing being investigated.

## The Setup

I'd been using Claude Code heavily for a few days, building a developer tool called [clauson](https://github.com/anhadg/clauson) — a CLI for analyzing Claude Code's JSONL session logs. After wrapping up a particularly long session, I checked my API bill: **$197 for a single session. 186 million tokens.**

That's... a lot. But I had no intuition for _where_ those tokens went. Was it the 356 bash commands? The 171 file reads? The 65 subagent tasks? I had the raw logs, and I had a tool purpose-built for querying them. So I did the obvious thing: I opened a new Claude Code session and told it to investigate.

> "I'm dropping you into the claude project history folder. I have a tool called clauson, which can be used to query and debug these jsonl files. Can you help me figure out for session f1cf0635 — what used the most amount of tokens? And what is a bad pattern that makes this happen?"

## The Tool

`clauson` is a Rust CLI that parses Claude Code's session logs (stored as JSONL files) and provides analytics on token usage, tool calls, timing, and conversation structure. Think of it as `htop` for Claude Code sessions. Key commands:

- `clauson <file> stats summary --group-by tool` — token breakdown by tool
- `clauson <file> stats summary --group-by turn` — token breakdown by conversation turn
- `clauson <file> stats sample --percentiles 90,95,99,100` — find the worst outliers
- `clauson <file> turns show <N>` — inspect a specific turn's tool call sequence

I handed Claude the session file, pointed it at `clauson`, and told it to go deep.

## The Investigation

Claude started methodically. First, it explored `clauson --help` and each subcommand to understand its capabilities. Then it began querying.

### Step 1: The Big Picture

```
$ clauson f1cf0635.jsonl stats summary --group-by tool --token-type all

Tool Name     Input  Output  Cache Create  Cache Read       Total
-----------------------------------------------------------------
Bash            907  26,382     2,320,649  62,014,428  64,362,366
(text)        1,109   2,346       858,913  27,210,827  28,073,195
Read          1,584   9,193     3,313,761  23,920,491  27,245,029
Task            256  29,914     1,204,701  14,121,394  15,356,265
Edit            167  12,046       172,885  13,520,425  13,705,523
```

Bash was the biggest consumer at 64M tokens — but not because bash commands themselves are expensive. The `Input` column shows only 907 tokens of actual new input across 356 bash calls. The real cost was in `Cache Read`: **62 million tokens** of conversation history being re-read on every single tool call.

### Step 2: Find the Worst Turns

```
$ clauson f1cf0635.jsonl stats sample --percentiles 90,95,99,100

Percentile  Turn       Total  User Prompt
--------------------------------------------------------------
p90           80   2,162,189  I've tested this out on real session data...
p95          189   3,099,091  <task-notification>...
p99          121   9,046,692  This session is being continued from a previous...
p99           47   9,385,436  This session is being continued from a previous...
p100          86  10,334,197  Yes, create a PR, then wait for all signals/tests...
```

Turn 86 was the worst offender: **10.3 million tokens in a single turn**. The prompt? "Yes, create a PR, then wait for all signals/tests to pass." Claude took that as permission to go fully autonomous — 47 tool calls over 8 minutes.

### Step 3: Understand the Pattern

Claude inspected turn 86's block sequence with `clauson turns show 86` and found the pattern: an autonomous loop of create PR, check CI, CI fails, read errors, fix lint in 12 files one at a time, re-run lint, re-run tests, push, wait for CI again, dispatch more agents. Each step is a separate API roundtrip that re-sends the entire conversation.

Then it pulled the overall token summary:

```
$ clauson f1cf0635.jsonl stats summary --group-by none --token-type all

Token Summary
────────────────────────────────────────
  Input tokens:                   5,401
  Cache creation tokens:     10,642,588
  Cache read tokens:        175,449,377
  Output tokens:                120,669
────────────────────────────────────────
  Total:                    186,218,035
```

**175 million out of 186 million tokens (94.2%) were cache reads.** The actual new input and output — the "real work" — was barely 126K tokens combined. The rest was the conversation being re-sent on every API call.

## The Findings

Claude identified the core cost driver and five specific bad patterns:

### The Core Problem: Context Amplification

Every time Claude Code calls a tool, it makes an API call. Every API call re-sends the full conversation history as cached input. In a session with 215 turns and ~165K tokens of context by the end, each tool call costs ~165K cache-read tokens just for the preamble. Multiply that by the 904 tool calls in this session and you get the 175M cache-read total.

The formula is simple: **cost = (number of tool calls) x (context size) x (price per cache-read token)**

### The Five Bad Patterns

**1. Runaway autonomous loops.** Turns 86, 47, and 121 had 47-73 tool calls each. These were "go do everything" prompts that let Claude run unsupervised for 8-11 minutes. Turn 86 alone (47 tool calls x ~150K context) burned ~7M tokens in cache reads.

**2. CI polling in the main session.** The main session was running `gh pr checks`, `sleep 60`, retry — in a loop. Each poll re-read the full 150K+ context. This should have been delegated to a subagent with a fresh, tiny context.

**3. Sequential single-file edits.** Turn 86 contained 14 sequential Edit calls fixing lint errors one file at a time (blocks 868-896). Each edit re-sent the full context. These could have been batched or delegated to a subagent.

**4. Heavy session continuations.** Turns 47, 68, 81, 90, 121, and 208 were all "continued from previous conversation" — dumping a large summary into context and then immediately doing 20-73 tool calls to re-establish state.

**5. High bash error rate.** 53 out of 356 bash calls failed (15%). Each failure plus its retry meant 2 extra API roundtrips at full context cost — failed port checks, merge conflicts, wrong branch names.

## The Math

Here's the pricing breakdown for the session, running on Claude Opus 4.6:

| Token Type       | Price per MTok | Tokens          | Cost         |
| ---------------- | -------------- | --------------- | ------------ |
| Input (uncached) | $5.00          | 5,401           | $0.03        |
| Cache Write      | $10.00         | 10,642,588      | $106.43      |
| Cache Read       | $0.50          | 175,449,377     | $87.72       |
| Output           | $25.00         | 120,669         | $3.02        |
| **Total**        |                | **186,218,035** | **~$197.20** |

Cache reads are 10x cheaper than regular input ($0.50 vs $5.00/MTok), but when you accumulate 175 million of them, even the discount rate adds up to $87. Cache writes — every new tool result and assistant message being written to cache — cost $106, making them the single largest line item.

The output tokens — Claude's actual _thinking_ and _writing_ — cost only $3.02. The real cost is in the plumbing.

## The Recommendations

Claude proposed six fixes with estimated savings:

**1. Break big tasks into checkpoints (~$20-30 savings).** Instead of "create a PR, wait for CI, fix failures, push, wait again," do each step as a separate turn. You get human checkpoints that prevent runaway loops.

**2. Offload polling to subagents (~$10-15 savings).** CI monitoring in a subagent starts with a fresh ~5K token context instead of the main session's 150K. Polling 5 times in a 150K context costs $0.37; in a 5K subagent context, $0.01.

**3. Batch sequential edits (~$5-10 savings).** 14 edits x 150K cache-read = 2.1M tokens ($1.05). One subagent doing all 14 edits in a 10K context = ~140K tokens ($0.07). That's 15x cheaper.

**4. Keep session continuations lean (~$10-15 savings).** Focus continuation summaries on what's next, not full history replay. Spawn a subagent to audit state rather than re-checking everything in the main session.

**5. Use `/compact` proactively (~$10-20 savings).** Context grows monotonically within a session. Compacting periodically shrinks the window, reducing the per-call cost of everything that follows.

**6. Reduce bash error rate.** Better CLAUDE.md instructions, combined scripts instead of individual commands — each prevented error saves two roundtrips at full context cost.

| Fix                         | Estimated Savings       |
| --------------------------- | ----------------------- |
| Checkpoint big tasks        | ~$20-30                 |
| CI polling in subagents     | ~$10-15                 |
| Batch edits / use subagents | ~$5-10                  |
| Lean session continuations  | ~$10-15                 |
| Proactive `/compact`        | ~$10-20                 |
| **Total potential**         | **~$55-90 of the $197** |

The single biggest lever: **fewer tool calls per turn in a large context.** Whether through smaller turns, subagents, or compacting, the math is the same.

## The Meta Bit

There's something genuinely novel about this workflow. Claude Code — an AI coding assistant — used a tool built _for_ analyzing its own session logs to investigate _its own_ token usage and produce a cost optimization report about _itself_.

It found bugs in the analysis tool along the way (the JSON output for per-block token breakdowns returned all zeros; file path parsing broke with shell variables). It suggested features (a `--sort-by` flag, per-block cost attribution, a built-in cost estimator). It even identified when it was hitting clauson limitations and worked around them by piping text output through Python instead.

The investigation itself was a live demonstration of the patterns it was diagnosing. Every `clauson` command Claude ran to analyze the expensive session was, itself, a tool call that re-sent the growing conversation context. The session analyzing the session was accumulating its own cache-read costs in real time — a recursion that Claude cheerfully acknowledged while continuing to run more queries.

This is what makes agent-based development interesting right now. The feedback loop between "tool that does work" and "tool that analyzes how the work was done" is tight enough that the agent can close it on its own. You hand it a problem about itself, and it produces a structured, actionable post-mortem — complete with dollar figures and percentage breakdowns — that a human would take hours to compile manually.

The $197 session built a working developer tool across multiple days of coding, testing, CI fixes, and PR management. Whether that's expensive depends on what you compare it to. But now we know exactly where the money went, and how to spend less next time. Because Claude told us.
