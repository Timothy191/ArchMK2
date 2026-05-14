# Wiki Schema

## Domain
Company knowledge base for Arch-Systems (Plantcor) — a multi-departmental mining operations portal. Covers people, systems, processes, decisions, issues, standards, and tribal knowledge accumulated across the organization.

## Conventions
- File names: lowercase, hyphens, no spaces (e.g., `shift-handover-process.md`)
- Every wiki page starts with YAML frontmatter (see below)
- Use `[[wikilinks]]` to link between pages (minimum 2 outbound links per page)
- When updating a page, always bump the `updated` date
- Every new page must be added to `index.md` under the correct section
- Every action must be appended to `log.md`
- **Provenance markers:** On pages that synthesize 3+ sources, append `^[raw/articles/source-file.md]`
  at the end of paragraphs whose claims come from a specific source.
- Use Obsidian-compatible wikilink syntax: `[[page-title]]` or `[[page-title|Display Text]]`

## Frontmatter
```yaml
---
title: Page Title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | query | summary
tags: [from taxonomy below]
sources: [raw/articles/source-name.md]
# Optional quality signals:
confidence: high | medium | low        # how well-supported the claims are
contested: true                         # set when the page has unresolved contradictions
contradictions: [other-page-slug]       # pages this one conflicts with
---
```

`confidence` and `contested` are optional but recommended for opinion-heavy or fast-moving
topics. Lint surfaces `contested: true` and `confidence: low` pages for review so weak claims
don't silently harden into accepted wiki fact.

### raw/ Frontmatter

Raw sources ALSO get a small frontmatter block so re-ingests can detect drift:

```yaml
---
source_url: https://example.com/article   # original URL, if applicable
ingested: YYYY-MM-DD
sha256: <hex digest of the raw content below the frontmatter>
---
```

The `sha256:` lets a future re-ingest of the same URL skip processing when content is unchanged,
and flag drift when it has changed. Compute over the body only (everything after the closing
`---`), not the frontmatter itself.

## Tag Taxonomy
- **Teams & People:** person, team, department, role, vendor
- **Systems & Products:** system, application, service, infrastructure, database, api
- **Processes & Workflows:** process, workflow, procedure, standard, sops
- **Projects & Initiatives:** project, initiative, milestone, deliverable, deployment
- **Concepts & Architecture:** concept, architecture, design, pattern, convention, integration
- **Decisions & Policies:** decision, rfc, adr, policy, guideline
- **Issues & Incidents:** issue, bug, incident, postmortem, risk
- **External:** regulation, competitor, partner, client
- **Meta:** comparison, timeline, glossary, onboarding, query

Rule: every tag on a page must appear in this taxonomy. If a new tag is needed,
add it here first, then use it. This prevents tag sprawl.

## Page Thresholds
- **Create a page** when an entity/concept appears in 2+ sources OR is central to one source
- **Add to existing page** when a source mentions something already covered
- **DON'T create a page** for passing mentions, minor details, or things outside the domain
- **Split a page** when it exceeds ~200 lines — break into sub-topics with cross-links
- **Archive a page** when its content is fully superseded — move to `_archive/`, remove from index

## Entity Pages
One page per notable entity (person, system, team, vendor, client). Include:
- Overview / what it is
- Key facts and dates
- Relationships to other entities ([[wikilinks]])
- Source references

## Concept Pages
One page per concept or topic (architecture, process, standard, integration). Include:
- Definition / explanation
- Current state of knowledge
- Open questions or debates
- Related concepts ([[wikilinks]])

## Comparison Pages
Side-by-side analyses (tool evaluations, vendor comparisons, design options). Include:
- What is being compared and why
- Dimensions of comparison (table format preferred)
- Verdict or synthesis
- Sources

## Update Policy
When new information conflicts with existing content:
1. Check the dates — newer sources generally supersede older ones
2. If genuinely contradictory, note both positions with dates and sources
3. Mark the contradiction in frontmatter: `contradictions: [page-name]`
4. Flag for user review in the lint report
