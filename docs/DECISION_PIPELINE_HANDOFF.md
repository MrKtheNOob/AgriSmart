# AgriSmart Decision Pipeline: Engineering Handoff

## Purpose and Product Direction

AgriSmart began as a hackathon crop-recommendation application and is evolving into an
agricultural decision-support platform. The internal principle is:

> Own the agricultural decision layer, not merely the recommendation layer.

The product should reduce uncertainty before someone spends money on seed, labor, water, or
fertilizer. Numeric suitability decisions belong in deterministic code. Retrieval and an LLM
should explain those decisions, supply agronomic context, and describe risks—not invent scores
or independently replace ranked crops.

## Implemented Pipeline

```text
Coordinates
    ├── iSDAsoil acquisition → normalized SoilProfile → agroecological zone
    └── nearest climate station → 12-month historical climate profile
                                      ↓
             soil matching + climate-window matching + water insight
                                      ↓
                       deterministic top-three crops
                                      ↓
                  RAG recommendation/explanation (current)
                                      ↓
                normal JSON response or streamed SSE result
```

`AgronomicService` is the business-logic orchestrator. Its synchronous and streaming paths now
return coordinates, soil, climate, water insight, deterministic crop rankings, and the existing
RAG recommendation. When iSDA reports desert, waterbody, or unsupported land, climate is still
returned while soil-dependent results are `null`.

Application construction has been separated into:

- `backend/app_config.py`: validates environment variables and owns repository paths.
- `backend/service_setup.py`: creates the complete service graph and cleans resources up.
- `backend/api_schemas.py`: API request/response models as they are extracted from `main.py`.
- `backend/services/agronomy/agronomic_service.py`: orchestration and CLI testing ground.

## Structured Crop Data and ETL Work

The original agronomic knowledge was prose/vector data. Deterministic comparison required a
structured crop catalog, making this a genuine extraction, transformation, and validation task.
Research results were merged and simplified through scripts in `backend/scripts/pipeline/`.

The runtime catalog is `backend/data/processed/crops_merged.json`. It currently contains ten
crops and requires each record to provide:

- soil N, extractable P and K, organic carbon, pH, clay, sand, and minimum CEC;
- preferred USDA textures and Senegal soil equivalents;
- optimal and tolerable temperature intervals;
- minimum and maximum seed-to-harvest duration;
- provenance, notes, and supporting research retained alongside machine fields.

`output.json` also has growth times, but `crops_merged.json` is the configured runtime source.
Required fields use direct indexing intentionally: missing attributes indicate a broken pipeline
and must fail visibly rather than silently lower confidence or become a default value.

Research deliberately avoided converting fertilizer application rates into soil nutrient
thresholds, annual rainfall into seasonal rainfall, or absolute maximum temperatures into heat
damage thresholds. Conflicting source ranges were preserved rather than averaged. Broader
international evidence is acceptable when Senegal-specific evidence is unavailable, provided
its provenance and applicability limits remain explicit.

## Soil Acquisition and Normalization

`iSDAsoilService` owns authentication, token reuse, HTTP acquisition, and provider-response
validation. `SoilAnalysisService` converts provider results into a `SoilProfile` with two views:

- `raw_properties`: numeric canonical values used by calculations;
- `properties`: translated/formatted values used by the UI and explanations.

The profile also includes a Senegal soil classification and an agroecological zone derived from
the request coordinates using local GeoJSON polygons. The zone is contextual evidence; it is not
derived from crop data and is not presently a ranking variable.

Imports within `services/soil/` were corrected to package-relative imports such as
`from .schemas import SoilProfile`. Cross-package imports remain rooted at `services.*`. Run a
service module from `backend/` with package context:

```bash
uv run python -m services.agronomy.agronomic_service
```

Running `uv run agronomic_service.py` directly does not establish the `services` package root.

## Climate Data Engineering

The original dataset is hourly historical weather covering approximately five years. It is not
a long-range forecast. `backend/scripts/simplify_climate_data.py` transforms it into the compact
monthly Feather dataset used by the service.

`ClimateService` finds the closest station and returns:

- station region and coordinates;
- source-data start and end dates;
- an annual summary;
- twelve calendar-month climatology records containing mean/min/max temperature, humidity,
  apparent temperature, precipitation, vapor-pressure deficit, heat days, rainy days, and years
  observed.

Pandas exposes row values through broad `Series` and `Scalar` types. Pylance errors around
`float()` and `int()` were solved at the pandas boundary by converting rows to typed dictionaries
before constructing Pydantic models. No separate Pyright installation is required; Pylance uses
the same analysis engine inside VS Code.

## Deterministic Ranking Algorithm

`CropRankingService` evaluates every crop and exposes only the top three. Soil and climate have
equal weight for the initial transparent baseline:

```text
overall_score = 0.50 × soil_score + 0.50 × climate_score
```

The soil score currently gives equal votes to required numeric ranges, minimum CEC, USDA texture,
and Senegal soil class. This is intentionally simple and can later move to agronomically tuned
weights.

Climate scoring starts in the UTC month when the request is made. A crop's maximum growth days
are converted conservatively with `ceil(days / 30)`. That many consecutive climatology months
are selected, wrapping December into January. For each month:

- inside the optimal temperature interval: `100`;
- between optimal and tolerable limits: linearly tapered from `100` to `50`;
- outside the tolerable interval: `0`.

The climate score is the mean across the complete growing window. Explicit future planting dates
can be added later; request-time planting keeps the first version operational and understandable.

## Water Insight

`WaterInsightService` remains part of the frontend/API contract. It estimates available water
capacity from clay, sand, and organic carbon, then returns:

```json
{
  "awc_value": 0.061,
  "retention_score": 24.4,
  "category": "Faible (Drainage Rapide)",
  "insight": "Le sol retient peu l'eau. Irrigation fréquente nécessaire."
}
```

The required raw soil attributes are accessed directly. Missing inputs are pipeline failures,
not reasons to substitute generic soil defaults. This water result is currently advisory and is
not an additional hidden component of the 50/50 crop score.

## Verified Behavior

The pipeline was developed atomically from the CLI before API integration:

1. package imports and Python compilation;
2. local climate lookup;
3. live iSDAsoil lookup and normalization;
4. soil and climate passed into ranking;
5. water insight and top-three ranking;
6. complete application server startup and response.

A Dakar test (`14.6928, -17.4467`) returned HTTP 200 from iSDA, a `Deck` soil in the `Niayes`
zone, 18 raw soil properties, the Dakar climate station, and all 12 climate months. One verified
September ranking produced Eggplant (`100`), Chili Pepper (`95`), and Okra (`95`), alongside a
`24.4` low-retention water score. Results vary with coordinates, current month, and catalog data.

## Current API Shape

The analysis response now includes the deterministic results separately from LLM prose:

```json
{
  "coordinates": { "lat": 14.69, "lng": -17.45 },
  "soil": {},
  "climate": {},
  "water_insight": {},
  "crop_rankings": [
    {
      "crop_name": "Eggplant",
      "soil_score": 100.0,
      "climate_score": 100.0,
      "overall_score": 100.0,
      "planting_month": 9,
      "growing_months": 6
    }
  ],
  "recommendation": {}
}
```

The frontend TypeScript contract includes `CropRanking`, while existing recommendation cards
still consume the LLM's `recommended_crops` structure. UI work must decide how to present the
new scores and how to avoid parallel lists drifting apart.

## RAG and Knowledge-Base Direction

The current RAG prompt still asks the model to choose three crops independently. This can
contradict deterministic rankings and is the next architectural issue. The intended design is:

1. deterministic ranking owns crop selection and order;
2. retrieval queries the knowledge base specifically for those crop names;
3. the LLM explains their scores using observed soil/climate values and retrieved evidence;
4. the LLM may describe risks and mitigations but may not add, remove, or reorder crops.

`backend/data/RAG/knowledge_base.md` has been expanded for the ten deterministic crops. Its job is
to explain soil, climate, water, Senegal context, risks, mitigation, and evidence limitations.
Exact scoring thresholds should remain in structured JSON rather than being duplicated in prose.

## Cropping Calendar Decision

A regional cropping calendar was considered for the explanation layer. Two forms were discussed:

- a compact planting calendar with crop, zone, cycle, sowing window, and harvest window;
- an operational calendar with nursery, transplanting, irrigation, treatment, and harvest tasks.

It is deferred for now. Traditional regional calendars can disagree with coordinate-level recent
climate, especially under climate change, different cultivars, and irrigation assumptions. Giving
the calendar directly to the LLM could cause it to override stronger deterministic evidence. A
future implementation should expose calendar alignment as a separate advisory signal, clearly
label disagreement, and never silently change the suitability score.

## Known Limitations and Deferred Work

- Climate is historical monthly climatology, not a forecast. The API source only supported a
  limited future horizon; forecast and seasonal-outlook integration remains future work.
- Climate ranking currently uses mean temperature only. Rainfall, humidity, VPD, extremes, and
  stage-specific sensitivity need compatible crop requirements before deterministic use.
- Monthly averages can conceal damaging short heat events and rainfall distribution problems.
- Soil and climate weights are provisional equal weights, selected for clarity rather than proven
  agronomic importance.
- Generic crop records are baseline envelopes, not cultivar-specific guarantees.
- Profitability, expected yield, markets, scenarios, pests, and input schedules are deliberately
  outside this vertical slice.
- Confidence, provenance, missing-data reporting, and limiting-factor explanations should become
  first-class response fields.
- The RAG output is still parsed from model-generated JSON and needs a stricter validated schema.
- The API has normal and SSE paths that must remain behaviorally aligned as fields evolve.

## Repository and Data Hygiene

Git LFS patterns exist for CSV, Feather, SQLite, images, PDFs, and model weights, but the local
`git-lfs` executable was unavailable during the checkpoint. The large raw climate CSV was kept
untracked; Feather data was committed as a normal Git object. Install Git LFS and migrate/amend
the local history before pushing large-data changes.

Do not delete current JSON fixtures yet: they remain useful for UI and offline pipeline checks.
Before merging to `main`, explicitly review and either rename, relocate, ignore, or remove files
such as climate/soil output examples, `out.csv`, editor configuration, cache databases, and ad-hoc
test scripts. Never commit credentials or the cached iSDA token.

## Next UI Work

The UI should make the deterministic decision legible rather than merely display another list:

- present the top three in backend order;
- show overall, soil, and climate scores without implying unsupported precision;
- show the evaluated planting month and growing-window length;
- retain the water-retention card;
- distinguish measured/calculated evidence from LLM explanation;
- reserve space for limiting factors, confidence, provenance, and future timing visuals;
- handle the desert/no-soil response and API failures explicitly.

The immediate UI decision is whether to merge deterministic rankings and LLM explanations into
one crop card or display them as separate sections. A single card is preferable once RAG is
constrained to explain the same crop names and order.
