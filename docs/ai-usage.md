# AI Usage

Please See the README's How AI was used section for the day-to-day account of building this project with Claude.

This document covers three areas that are worth calling out separately:

1. Evaluating unsolicited AI advice,
2. Using AI during the framework migration, and
3. Using AI when adding supporting tooling.

# Evaluating AI advice, not just AI code

Partway through the project, I gave the assessment brief to several AI assistants and asked for their interpretation of what was being tested and how they would approach it.

The responses were extensive: architecture alternatives, a 220-point decision inventory, edge-case tables, a proposed docs/ structure, Prisma schemas, and implementation suggestions.

I did not treat that output as a specification or implement it wholesale. I treated it as a second opinion to be reviewed against the assessment brief and the code already built, much as I would review a colleague's design document.

Adopted after review

Several recommendations held up under closer examination and were incorporated:

Snapshotting the fee at enrolment (assignedFee) rather than calculating balances from the programme's current fee. This prevents later programme-fee changes from retroactively changing an existing student's financial obligation.
Replacing count-based Student ID generation with an atomic database counter. The original approach had a real race condition under concurrent enrolments.
Rejecting overpayments and creating payments inside a serializable transaction. This prevents concurrent payment requests from jointly exceeding the student's outstanding balance.
Treating "not graded", "withheld", and "published" as distinct grade states. This also exposed a real issue in the original grading UI where a normal "Save" operation could potentially modify an already-published score.
Documenting product decisions and edge cases separately in docs/product-decisions.md and docs/edge-cases.md, rather than leaving important reasoning implicit in implementation details.

The important part was not simply accepting these recommendations. Each was checked against the actual requirements and implementation cost before being adopted.

# Deliberately not adopted

Several AI suggestions were intentionally rejected. The reasons are documented in the What we deliberately did not build section of docs/product-decisions.md.

These include:

Decimal grade precision
A dedicated currency field
Submission attempt/version history
createdBy / updatedBy audit columns
URL-synchronised filter state
Bulk grade publication
CSV import/export

The reason for not implementing these was not simply lack of time. They were evaluated against the four workflows specified in the assessment brief, and none was necessary to satisfy those workflows.

This distinction matters because a long AI-generated checklist can easily become a substitute for engineering judgment. The useful outcome of the review was identifying which suggestions materially improved correctness and which would add complexity without improving the required product.

# Migrating the stack

The framework versions were subsequently upgraded from:

Next.js 14 → 16
Tailwind CSS 3 → 4
Prisma 5 → 7

This was a different form of AI-assisted development. The emphasis was less on generating implementation code and more on verifying assumptions before making changes.

Three issues were identified through actually executing the project rather than relying solely on documentation or generated suggestions.

1. prisma@latest resolved to a release candidate

Using "prisma": "latest" resulted in a Prisma 8 release-candidate package being installed, while @prisma/client@latest resolved to stable 7.x.

This was verified with package inspection and npm audit / npm ls, rather than assuming that latest meant the same stable release across the Prisma packages.

The dependency was subsequently pinned to Prisma 7 (^7.10.0) so that the CLI and client remained on the same stable major version.

2. Prisma's Decimal export had moved

An existing import from:

@prisma/client/runtime/library

no longer matched the Prisma 7 package structure.

Rather than assuming the new location from generated advice, the candidate import was tested directly in Node. The working Prisma 7 export was confirmed under:

@prisma/client/runtime/client

This mattered because the incorrect import would otherwise have remained hidden until runtime.

3. Tailwind v4 changed @apply behaviour

The existing stylesheet used custom component classes through @apply, including patterns such as:

.btn-primary { @apply btn ... }

This compiled under the previous Tailwind version but failed under Tailwind v4 with an unknown utility error.

The issue was reproduced by compiling the project's actual stylesheet with the Tailwind CLI. The affected styles were then rewritten rather than relying on migration articles that did not cover this particular pattern.

CLI limitations

Some migration operations could not be fully executed in the development environment.

prisma generate and prisma db push require Prisma's schema-engine binary, which could not be downloaded because of the environment's network restrictions.

To continue validating the rest of the codebase, a temporary, clearly labelled Prisma client type stub was used for typechecking. The stub was deleted before the project was handed over and is not part of the application.

Consequently, the migration was structurally and typechecked against the project, but the affected Prisma CLI operations were not fully exercised against a live database in that environment.

# Adding Zod, tests, Docker, and shadcn/ui

A later pass added:

- Zod validation
- Unit tests
- Docker configuration
- shadcn/ui-inspired components

Again, the goal was to verify assumptions rather than blindly follow generated output.

# Checking dependency versions before installing

The earlier Prisma latest issue made it important to check the package metadata before adding another fast-moving dependency.

Before adding Zod, the npm distribution tags were checked to confirm that latest pointed to a stable release. The project was then installed against the verified stable Zod release.

# Reproducing stable shadcn/ui patterns

The shadcn CLI could not retrieve component source from its registry in the development environment. This was confirmed by actually attempting the CLI operation rather than assuming the network request would fail.

Rather than making the UI migration dependent on that unavailable registry, the required components were hand-authored using the established shadcn conventions:

cva-based variants for Button and Badge
lightweight wrappers around native elements for Input and Card
Radix primitive wrappers for components such as Label and Select

The resulting implementation was then validated through the project's CSS compilation and TypeScript checks.

This was considered an appropriate use of existing knowledge because the task was reproducing stable component structure, not determining a version-sensitive API or package release.

# Remaining verification

The Docker image could not be built in the development environment because a Docker daemon was unavailable.

The shadcn migration was also intentionally partial rather than being represented as complete. The migrated components and the remaining pre-migration styling are documented in docs/product-decisions.md.

These limitations are recorded here so that the documentation distinguishes between:

functionality that was implemented and tested,
functionality that was implemented but could not be fully exercised in the available environment, and
functionality that was intentionally left outside the assessment scope.

# Overall approach

The main lesson from the AI-assisted development process was that AI output was treated as input to engineering judgment, not as the engineering judgment itself.

AI was useful for:

- identifying potential race conditions and edge cases,
- suggesting alternative architectures,
- accelerating implementation,
- reviewing existing decisions,
- generating test cases,
- and helping investigate framework migrations.

The final decisions were made by checking those suggestions against the assessment requirements, the existing code, actual compiler/runtime behavior, and the complexity they introduced.

That distinction was particularly important when the AI's initial assumptions were wrong or incomplete. Running the real project, reading compiler/runtime errors, and testing the proposed solution provided the final verification layer.
