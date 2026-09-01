# AgriSmart Decision Layer — Implementation Summary

## Product Direction

AgriSmart should evolve from a crop recommendation tool into an agricultural decision-support system. Its core question is not simply **“What can I grow here?”**, but:

> **“Should I plant this crop at this location during this season, and what must I do to succeed?”**

The product filter is therefore: **Does this feature reduce uncertainty before a user commits money, time, or inputs?** Chatbots, elaborate animations, voice interfaces, and cosmetic improvements remain secondary unless they improve the decision.

## Initial Decision Scope

The first version should support three decisions:

1. **Suitability:** Can the selected crop reasonably grow at this location?
2. **Timing:** What is the safest planting window?
3. **Readiness:** Which conditions must be corrected before planting?

Profitability, advanced pest forecasting, multiple scenarios, and complete farm operations can follow after this vertical slice works reliably.

## Required Architecture

```text
Agronomic documents and RAG knowledge base
                    ↓
     Structured crop requirements catalog
                    +
        Location soil and climate evidence
                    ↓
          Deterministic comparisons
                    ↓
    Compatibility, risks, gaps, confidence
                    ↓
       LLM explanation and corrective advice
                    ↓
           User-facing decision report
```

### 1. Structured Crop Requirements

The RAG knowledge base contains valuable crop facts, but prose is difficult to calculate with consistently. Extract a small, reviewed subset into machine-readable crop profiles—initially JSON files rather than a database.

Each profile should cover:

- optimal and tolerable soil pH, texture, drainage, and relevant nutrients;
- optimal and critical temperatures;
- seasonal and growth-stage water requirements;
- growth stages, duration, and sensitive periods;
- planting conditions, maturity duration, and major risks;
- source document, quotation/reference, region, publication date, and review status.

The LLM can help extract draft profiles from retrieved passages, but important thresholds must be manually verified. The original knowledge base remains the source of explanations and broader guidance.

### 2. Decision Calculations

Compare “what the crop needs” with “what the location provides.” Code—not the LLM—should perform numeric comparisons such as:

```text
Observed soil pH: 7.8       vs optimal range: 6.0–7.0
Expected rainfall: 320 mm   vs crop requirement: 400–600 mm
Peak temperature: 36°C     vs critical maximum: 35°C
```

Calculate separate soil, temperature, and water results. Use explicit rules for critical blockers, then transparent weights for an overall score. Missing or weak data should reduce evidence confidence rather than silently becoming an assumption.

The LLM should explain calculated findings, retrieve supporting agronomic guidance, and suggest corrective actions. It should not invent thresholds, perform hidden scoring, or present unsupported precision.

### 3. Climate and Timing

Historical climate data already supports seasonal patterns, variability, heat frequency, and typical rainfall onset. Forecasts add information about the upcoming season but must be labeled by horizon and certainty.

Develop progressively:

1. historical planting suitability;
2. short-range forecast adjustments;
3. seasonal outlooks and dry/normal/wet scenarios.

The climate–crop synchronization chart is a visualization of these calculations. It should overlay rainfall and temperature with the crop's planting window, growth stages, water demand, and critical thresholds.

## Expected Decision Output

The backend should return structured results that the frontend can display without parsing prose:

```text
Decision report
├── crop, location, season, and production assumptions
├── verdict: recommended / conditional / not recommended
├── soil, temperature, and water assessments
├── planting window and growth-stage timing
├── triggered risks and compatibility gaps
├── required corrective actions
├── evidence sources, freshness, and resolution
├── missing data and explicit assumptions
└── evidence-confidence level and reasons
```

The user-facing page can then show a verdict, climate–crop timeline, soil-readiness table, risk panel, confidence/provenance panel, and a clear next action. After the user chooses to proceed, AgriSmart can generate a planting, irrigation, fertilization, and monitoring plan.

## Practical First Milestone

Start with one locally important, well-documented crop:

1. Extract and review one crop profile from the existing knowledge base.
2. Run the current soil and historical climate pipeline for one real location.
3. Implement pH, temperature, and seasonal-water comparisons.
4. Return `suitable`, `conditional`, or `high_risk` for each component.
5. Include triggered rules, evidence references, assumptions, and missing data.
6. Produce an overall verdict and plain-text explanation.
7. Validate the result before building the polished chart.

This experiment proves the decision layer without requiring a universal crop database or perfect forecast infrastructure. A successful first result should clearly state what is suitable, what is risky, what action is required, and how trustworthy the conclusion is.
