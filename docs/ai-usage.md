# AI Usage

See the README's "How AI was used" section for the day-to-day account of
building this with Claude. This file covers one specific round worth calling
out separately: evaluating unsolicited AI-generated advice about the
assessment itself.

## Evaluating AI advice, not just AI code

Partway through, I fed this assessment to a couple of different AI
assistants and asked for their read on what was being tested and how to
approach it. They came back with extremely long, thorough documents —
architecture options, a 220-point decision inventory, edge-case tables, a
recommended `docs/` structure, sample Prisma schemas, and so on.

Rather than implementing that output wholesale, I treated it as a second
opinion to be reviewed against what was already built, the same way I'd
review a colleague's design doc. Concretely:

**Adopted, because the reasoning held up:**
- Snapshotting the fee at enrolment (`assignedFee`) instead of computing
  balances against the programme's live fee.
- Replacing count-based Student ID generation with an atomic DB counter —
  the original approach had a real (if narrow) race condition under
  concurrent enrolments.
- Rejecting overpayments, and specifically running payment creation inside a
  serializable transaction so two concurrent payments can't jointly overdraw
  an account.
- Treating "not graded," "withheld," and "published" as three distinct
  states, and protecting published grades from silent score edits — this
  also surfaced a real bug in the existing "Save" button, which is a good
  example of adversarial review catching something outside its original ask.
- Writing down decisions and edge cases as their own documents
  (`docs/product-decisions.md`, `docs/edge-cases.md`) rather than leaving
  the reasoning implicit in code comments only.

**Deliberately not adopted, with reasons recorded in
`docs/product-decisions.md`'s "What we deliberately did not build" section:**
- Decimal grade precision, a currency field, submission attempt/version
  history, `createdBy`/`updatedBy` audit columns, URL-synced filter state,
  bulk grade publication, CSV import/export.

The reasoning for skipping these isn't "no time" — several would have been
cheap to add. It's that none of them are required by the four workflows the
brief actually specifies, and the brief itself rewards focus over breadth
("we care more about how you think than how much you build"). Implementing
every suggestion in a 220-point AI-generated checklist would have been the
*wrong* use of that advice — the useful skill here is evaluating which
suggestions earn their complexity, not treating a long AI output as a
todo list to clear.

## Migrating the stack (Next.js 14→16, Tailwind 3→4, Prisma 5→7)

Separately from the above, the framework versions were later upgraded to
current stable releases. This is worth documenting on its own because it's a
different kind of AI usage than the rest of the build: less "generate this
feature," more "verify this claim before I act on it."

Three real problems surfaced specifically *because* things were actually
executed rather than just edited by pattern-matching against training data:

1. **`prisma@latest` resolves to a beta package.** Running `npm install`
   with `"prisma": "latest"` in package.json silently installed
   `8.0.0-rc.12` — a beta "unified CLI" product bundling experimental
   tooling with several known vulnerabilities (confirmed via `npm audit`
   and `npm ls`). `@prisma/client@latest` correctly resolved to the stable
   `7.10.0`. Fixed by pinning `prisma` to `^7.10.0` to match. A pure
   documentation-based migration would very plausibly have missed this,
   since Prisma's own docs describe 7.x as current stable.
2. **A moved export silently changes from a type error to a runtime
   error.** Prisma 7 relocated `Decimal`'s export from
   `@prisma/client/runtime/library` to `@prisma/client/runtime/client`.
   Confirmed by actually attempting the import in Node (`node -e`), not by
   inference — an incorrect guess here would have looked fine until the
   first request that touched a monetary value.
3. **Tailwind v4's `@apply` doesn't support chaining custom component
   classes.** `.btn-primary { @apply btn ...; }` (referencing another
   hand-defined class named `.btn`) compiled fine in v3 but fails outright
   in v4 ("Cannot apply unknown utility class `btn`"). This was caught by
   actually running `@tailwindcss/cli` against the real stylesheet and
   reading the compiler's own error, not by reading a migration guide —
   several v4 migration articles gathered for this project didn't mention
   this specific case.

What could **not** be verified this way: `prisma generate` and `prisma db
push` still require downloading a `schema-engine` binary from a host this
sandbox's network policy blocks (Prisma 7 removed the old *query*-engine
binary, which is progress, but a separate schema-engine binary remains for
CLI operations). To still get real signal on the other ~95% of the codebase,
a temporary, clearly-labeled type stub was substituted for the generated
Prisma client, the full project was typechecked against it, and the stub
was deleted before the code was handed over — it never shipped as part of
the project. The honest summary: this migration is typechecked and
structurally verified, but not yet run end-to-end against a live database.
