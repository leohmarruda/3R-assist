# Assumption Log — 3R Assist

> **Binary success definition:**
> A researcher with no prior knowledge of alternative methods describes a real protocol in free text, and receives at least 3 relevant recommendations with verifiable source references in under 60 seconds.

Updated at: M1.5 (initial), M2 Phase A checkpoint, M3.4, M4, M5.

---

| # | Assumption | Why it matters | How to test cheaply | Status |
|---|---|---|---|---|
| H1 | Users can describe experimental protocols in free text in a way that yields useful parameters without structured prompting | If false, the free-text input path fails and a guided form becomes necessary — a fundamental architecture change | Ask 5 researchers to describe a real protocol in free text; verify whether biological model, endpoint, and procedure appear without prompting | Untested |
| H2 | ALT Web, ECVAM, and OECD together provide sufficient and accessible data to cover common Brazilian CEUA endpoints | If coverage is low or access is blocked, the MVP has no viable database | Manually check 10 representative protocols against these sources and count matches; verify terms of use for permitted automation | Untested |
| H3 | LLM-based text analysis can extract experimental parameters with sufficient precision for relevant retrieval | If extraction is imprecise, recommendations are irrelevant — this is the core product risk | Build a minimal prototype (prompt + 20 seed records) and test with 5 real protocols; measure precision | Untested |
| H4 | Researchers trust recommendations when primary-source traceability is provided | If false, the tool is unusable in any regulatory or ethics-committee context | Show 3 potential users a mockup with recommendation + reference; ask "would you cite this in an ethics submission?" | Untested |
| H5 | Building and maintaining a curated methods database at adequate quality is tractable for the team | If curation is unsustainable, the product degrades quickly post-launch | Estimate in 2 hours: how many candidate entries exist, update frequency, exportable format | Untested |

---

## Notes

**Assumption most likely to be wrong (H3):** The parameter-correction step on the results screen is the insurance — but if correction is frequently needed, the tool shifts from "AI-powered" to "AI-assisted form fill," which weakens the value proposition. The pilot (Module 5) will resolve this.

**Structural fallback (H1 + H3):** A structured form (fields for biological model, endpoint, etc.) plus semantic search is preserved as an explicit fallback. If H1 or H3 fail in the pilot, this path is activated without a full architecture rewrite.

**Known operational risk (not a testable assumption):** Combined 8h/week is a hard scope ceiling. This is tracked as a scope constraint, not an assumption.

---

## Revision history

| Date | Module | Changes |
|---|---|---|
| *(bootstrap)* | M0 | Initialized from `project-proposal.md` section 13 |
