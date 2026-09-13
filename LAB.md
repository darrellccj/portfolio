# Lab

Only build in `/lab`.

1. Check which experiment this is for (e.g. Experiment #001) in `src/app/(site)/lab/page.tsx`. The `EXPERIMENTS` array already lists every experiment, including ones not yet run (empty `Prompt`/`Output` fields, "Not yet run" placeholder). Fill in the existing entry that matches the request — do not add a new entry to `EXPERIMENTS` unless the user explicitly asks for a new experiment.
2. Fill in the **Prompt** field — the exact prompt used, plus which model ran it.
3. Build the output in the relevant path, then link or embed it in the **Output** field.
4. If the experiment is run more than once (e.g. Repeatability), don't overwrite the existing Prompt/Output — number them instead: `Prompt 1` / `Output 1`, `Prompt 2` / `Output 2`, etc., in run order.

No need to screenshot and QA. Automatically commit and push.