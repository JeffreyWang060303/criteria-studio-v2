CRITERIA STUDIO — Separate integrated prototype

Run with Python 3.10 or later, no installation needed:
  cd /Users/jeff/criteria-studio-v2
  python3 server.py
Open http://localhost:8765

This new folder does not change Prototype 1 or any existing website.

The complete workflow runs in guided demo mode. Three interactive application
templates are included: volunteer signup, equipment lending, and study tasks.
Demo mode is explicitly labeled; it is not an LLM. Custom criteria are recorded
but are not guaranteed to be implemented by a template.

For real AI, configure OPENAI_API_KEY in the server environment and restart.
OPENAI_MODEL optionally overrides the default model (gpt-4.1).
Then choose Live AI in the site's connection settings. No key goes into the
browser or exported project. Clarification, readiness, and generation use
separate API calls. Current API usage may incur provider charges.

Live calls use the Responses API:
https://developers.openai.com/api/reference/resources/responses/methods/create
The API adapter is implemented and validated with mocked responses; actual
provider calls cannot be verified until a key is configured.

The server is bound to loopback, validates Host/Origin, and serves only public/.
Generated previews have a unique sandbox origin, no parent access, and a CSP
that blocks networking. Downloaded generated HTML is no longer sandboxed.

Storage: local browser only, including study entries. Export project JSON to
back up or move a project; import through New project. New projects export the
previous project automatically. Output versions retain immutable approved
briefs. Editing the brief revokes approval and marks older output as stale.

Research & evaluation includes the supplied current status, a visual system
map, preparation checklist, proposed relative course timeline, 6–8 participant
target, participant/internal-case log, protocol download, and fallback plan.
There are no fabricated participant sessions or effectiveness results.

Publication: Sites publishing was unavailable in the connected workspace.
This is a local website, not a new publicly hosted URL. Static demo files in
public/ can be hosted on a static host. Live mode requires a protected Python
backend, HTTPS, authentication, rate limits, and appropriate persistent storage
before making it a shared service. The local server deliberately rejects
non-local hosts; do not use it as an unauthenticated public API proxy.

Tests:
  python3 -m unittest discover -s tests -v
  JavaScript workflow tests: tests/engine.test.mjs (Node 18+ if installed)
