# Crop Knowledge Pipeline

## Intent

This directory contains the beginnings of a data-engineering subproject for AgriSmart. Its purpose is to transform the valuable agronomic knowledge currently stored as prose in the RAG knowledge base into a structured, validated, and versioned crop-requirements dataset.

AgriSmart currently combines soil data, historical climate data, and retrieved agronomic passages before asking an LLM for recommendations. That works for explanations, but it makes numeric comparisons, consistent scoring, planting-window calculations, and scenario analysis difficult to reproduce.

The pipeline should make those calculations possible without replacing RAG:

```text
Agronomic documents / RAG knowledge base
                  ↓ Extract
         Crop-specific claims
                  ↓ Transform
  Normalize metrics, units, ranges, stages
                  ↓ Validate
 Check provenance, conflicts, and uncertainty
                  ↓ Load / Publish
 Versioned, machine-readable crop profiles
                  ↓ Consume
       AgriSmart decision engine
```

## Responsibilities

The pipeline should eventually:

- identify crop requirements in the existing knowledge base;
- use RAG and an LLM to extract draft structured claims;
- distinguish optimal, tolerable, and critical thresholds;
- normalize units and agricultural concepts;
- associate requirements with growth stages, regions, varieties, and production systems where applicable;
- retain the source document and passage for every extracted value;
- flag missing values and conflicting sources;
- require human review for decision-critical thresholds;
- publish validated crop profiles for AgriSmart to consume.

The LLM may accelerate extraction, but its output must not automatically become trusted production data.

## Expected Data

Initial crop profiles should focus on information required for three decisions:

1. **Suitability:** Can this crop reasonably grow at the selected location?
2. **Timing:** What is the safest planting window?
3. **Readiness:** What must be corrected before planting?

Relevant fields include:

- soil pH, texture, drainage, organic matter, and nutrients;
- optimal and critical temperatures;
- seasonal and growth-stage water requirements;
- growth stages, stage durations, and sensitive periods;
- planting conditions and time to maturity;
- heat, drought, flood, frost, pest, and disease sensitivities;
- provenance, geographic applicability, extraction method, review status, and confidence.

Avoid designing one wide table with a column for every possible property. Requirements can vary by growth stage, variety, region, and source. Begin with versioned JSON and introduce relational storage only when the access patterns are understood.

## Boundary With the Main Application

```text
Crop knowledge pipeline                 AgriSmart application
───────────────────────                 ─────────────────────
Ingest agronomic sources                Receive crop and location intent
Extract and normalize claims            Fetch soil and climate evidence
Resolve or expose conflicts             Compare evidence to requirements
Record provenance and review state      Calculate gaps, risks, and timing
Publish dataset releases                Explain and visualize the decision
```

The application should consume a released dataset. It should not run document extraction during each user analysis. Deterministic code should perform numeric comparisons; RAG and the LLM should supply supporting context, explanations, and corrective guidance.

## Expected Product Output

The structured dataset will enable AgriSmart to produce a decision report containing:

- a `recommended`, `conditional`, or `not_recommended` verdict;
- separate soil, temperature, and water assessments;
- observed values compared with crop requirements;
- a defensible planting window;
- critical risks and required corrective actions;
- evidence sources, freshness, assumptions, and missing data;
- an evidence-confidence assessment;
- later, dry-season scenarios and an operational crop plan.

The climate–crop chart and soil-readiness table are presentations of these computed results, not the purpose of the dataset itself.

## First Milestone

Do not begin by modeling every crop. Prove the complete pipeline with one locally important, well-documented crop:

1. Retrieve all relevant passages for that crop.
2. Extract a draft profile into a defined schema.
3. Preserve source references for every claim.
4. Normalize units and classify thresholds.
5. Manually review the important values.
6. Publish one validated profile.
7. Compare it with one real soil and historical climate response.
8. Produce soil, temperature, and water findings with triggered rules.

Success means the application can explain what is suitable, what is risky, what action is required, which evidence supports the conclusion, and what remains uncertain. This first crop will reveal the real schema and validation needs before the pipeline expands.
