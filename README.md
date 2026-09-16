# CareCircle

**An AI-powered health companion for elderly patients and their caregivers** — combining evidence-grounded medical Q&A, prescription safety verification, personalized health anomaly detection, and emergency alerting into one system.

Built for [Hackathon Name] — evolved from an elder-care tracker into a condition-aware medical AI system after Review 1 feedback that the original version lacked real technical depth.

---

## The Problem

Elderly patients face two compounding risks that existing apps don't address:

1. **Medication complexity** — multiple prescriptions, often from different doctors, with no easy way to check for duplicates or dangerous interactions before they're taken
2. **Health misinformation** — conflicting advice from family, social media, and word of mouth, with no fast way to verify what's actually backed by evidence

On top of this, most health apps use fixed, one-size-fits-all thresholds ("BP over 140 = alert") that ignore the fact that "normal" is different for every patient, and most are not designed with elderly, less tech-literate users in mind.

CareCircle addresses all three: **verified answers, verified prescriptions, and personalized detection** — with an emergency layer underneath.

---

## Core Features

### 🔍 Evidence-Grounded Health Assistant (RAG)

A condition-aware retrieval-augmented generation system — not a chatbot wrapper, a real hybrid retrieval pipeline:

```
Patient's registered condition (diabetes / hypertension)
        ↓
   Natural-language question
        ↓
  Condition-scoped retrieval
        ↓
┌───────────────┬───────────────┐
│  Dense (embeddings)  │   BM25 (sparse)   │
└───────────────┴───────────────┘
        ↓
Reciprocal Rank Fusion (RRF)
        ↓
Cross-encoder reranker (ms-marco-MiniLM-L-6-v2)
        ↓
   Post-retrieval relevance gate
        ↓
Grounded LLM generation (openai/gpt-oss-120b via Groq)
        ↓
   Answer + citations
```

**Key design decisions:**
- **No hallucination by design** — the LLM only receives retrieved evidence and is instructed to say *"the available sources do not provide enough information to answer that"* rather than inventing a number or fact
- **Post-retrieval scope gating**, not keyword filtering — the system runs full retrieval for every question and decides relevance from the reranker's evidence score, so naturally-phrased questions ("Can I skip breakfast?") aren't wrongly rejected the way a keyword-matching gate would reject them
- **Authoritative sources only**: AHA 2025 Hypertension Guideline, NHLBI BP resources, ADA 2026 Diabetes Standards of Care, NIDDK diabetes content — 517 chunks across 6 documents (409 diabetes, 108 hypertension)

**Evaluated, not just demoed:** 14/18 (77.8%) accuracy on a held-out test set of natural-language questions (9/12 should-answer, 5/6 should-refuse). We identified and documented a real remaining edge case — some off-topic questions can score higher on relevance than legitimate edge-case questions — as a known limitation, not a hidden one.

### 💊 Prescription Safety Checker

```
Prescription A + Prescription B
        ↓
   Drug name extraction
        ↓
  RxNorm normalization (NIH/NLM)
        ↓
┌───────────────┬───────────────┐
│ Duplicate detection │ FDA interaction lookup │
└───────────────┴───────────────┘
        ↓
Structured safety report
(severity, mechanism, recommendation, source)
```

- RxNorm normalization ensures "Lisinopril," "lisinopril," and "LISINOPRIL" all resolve to the same drug — no missed matches from casing/formatting
- Interaction data sourced from **FDA/openFDA** — 175 unique, verified interaction pairs, deliberately built from confirmed sources rather than a larger but unverifiable dataset
- Explicit, honest scoping: **a pair not found in the dataset does not mean no interaction exists** — this is stated in the product, not just internally

**Evaluated:** 12/12 (100%) on a hand-crafted test set covering duplicate detection, confirmed FDA interactions, and clean (no-interaction) cases.

### 📈 Personalized Baseline Detection

Instead of fixed medical thresholds, CareCircle learns what's normal for each elder individually:

```
Daily check-in (BP, mood, symptoms, medication status)
        ↓
Compare against elder's own historical baseline
        ↓
┌────────────────────┬────────────────────┐
│ Combination-rule       │  Trend/drift detection   │
│ anomaly detection      │  (catches gradual change  │
│ (flags concerning       │   before a hard threshold │
│  combinations, e.g.     │   is crossed)             │
│  missed dose + tired)   │                            │
└────────────────────┴────────────────────┘
        ↓
   Investigation pipeline
(current medication status, symptom history,
 repeat-occurrence check, recent medication changes)
        ↓
   Handoff Report generation
(fixed-template report, grounded facts,
 then rewritten in natural language via LLM —
 facts locked, tone only is rewritten)
        ↓
   Delivered to caregiver dashboard
```

**Evaluated against 3 hand-crafted scenarios:**
- Known anomaly (elevated reading + missed dose + recent medication change) → correctly flagged, with full investigation context
- Mild false-alarm case (slightly elevated reading, but otherwise normal) → correctly stayed silent, proving the system doesn't over-alert
- Gradual trend (values climbing steadily, no single reading crossing a hard threshold) → correctly caught via trend detection

### 🚨 SOS / Emergency Alerts

One-tap emergency flow connecting the elder directly to their registered caregiver, layered on top of the same alert delivery system used for health anomaly notifications — so both urgent self-reported emergencies and system-detected anomalies reach the caregiver through one consistent channel.

---

## Architecture

```
                        CARECIRCLE
                            │
                Authenticated Patient (session-based)
                            │
          ┌─────────────────┴─────────────────┐
          │                                     │
    Patient Data Layer                    AI Assistant Layer
          │                                     │
   ┌──────┴──────┐                  ┌───────────┴───────────┐
   │             │                  │                        │
Medications   Check-ins        Prescription              Health RAG
Dose Logs     Alerts             Checker                     │
                  │                  │              Dense + BM25 + RRF
                  │            RxNorm + FDA                  │
                  │                                      Reranker
             SOS / Emergency                                 │
                Alerts                                    Grounded LLM
                  │                                           │
                  └───────────────┬───────────────────────────┘
                                   │
                        Caregiver Dashboard
                     (Handoff Reports, Alerts,
                      Prescription Results,
                      Health Q&A History)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| Backend | Python, Flask |
| Database | SQLite (patient-scoped: users, medications, dose logs, check-ins, alerts, health questions, prescription checks) |
| Auth | Flask session-based authentication, hashed passwords |
| Retrieval | Dense embeddings (`all-MiniLM-L6-v2`) + BM25, fused via RRF |
| Reranking | Cross-encoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`) |
| Generation | Groq (`openai/gpt-oss-120b`), grounded/citation-constrained |
| Drug normalization | RxNorm (NIH/NLM) |
| Interaction data | FDA / openFDA |

---

## Security & Safety Design

- Patient identity is derived from the authenticated session (`session["user_id"]`), never trusted from client-supplied request data — prevents one patient from impersonating another
- Patient data isolation tested directly: cross-patient access attempts return `404`
- Passwords are never stored in `localStorage`
- The Health Assistant is designed to **refuse rather than guess** when evidence is insufficient — a deliberate safety property, not a missing feature
- The Prescription Checker states its own data limitations rather than implying complete interaction coverage

---

## Evaluation Summary

| Component | Result |
|---|---|
| Health Assistant scope gate | 14/18 (77.8%) — 9/12 should-answer, 5/6 should-refuse |
| Prescription Checker | 12/12 (100%) |
| Baseline anomaly detection | 3/3 hand-crafted scenarios correctly classified (anomaly, false-alarm, trend) |

We report these numbers as-is, including a known limitation in the Health Assistant's relevance threshold (some off-topic questions can score higher than legitimate edge-case questions), which we've identified as needing a secondary classification layer as future work — rather than a single fixed score cutoff.

---

## What Changed Since Review 1

Review 1 feedback: *"Where is the actual AI/technical contribution?"*

We didn't patch the existing app with a chatbot bolted on top — we rebuilt the AI layer from scratch:
- Designed and implemented a real hybrid RAG pipeline (dense + BM25 + RRF + reranking), not a single embedding lookup
- Built a prescription safety system with real drug normalization and FDA-sourced interaction data
- Added full authentication and patient-scoped data infrastructure, replacing shared browser state
- Found and fixed a real bug ourselves — an overly strict keyword-based scope gate — by tracing the actual retrieval scores and replacing it with a principled post-retrieval relevance check
- Built evaluation scripts for every AI component, so every claim in this README is backed by a number, not just a demo

---

## Future Work

- Expand the FDA-confirmed interaction dataset toward a licensed clinical interaction database for production-grade coverage
- Address the identified scope-gate edge case with a secondary classification layer
- Voice AI assistant for hands-free interaction
- Location sharing / safe-zone alerts
- Deeper accessibility settings beyond the current large-text mode

---

## Team

Ruvanthika S
Harinee S
Mehavarthini Arul

