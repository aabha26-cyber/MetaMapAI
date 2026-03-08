# OncoSignal

**AI that detects early scientific red flags in cancer drug research.**

OncoSignal scans oncology literature from PubMed, extracts structured research signals with an LLM, and computes a **Scientific Fragility Score** to help researchers and investors assess stability of early science in a therapy area.

## Quick start

1. **Install dependencies**  
   `npm install`

2. **Set your OpenAI API key**  
   Copy `.env.example` to `.env.local` and add your key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set OPENAI_API_KEY=sk-...
   ```

3. **Run the app**  
   `npm run dev`  
   Open [http://localhost:3000](http://localhost:3000).

4. **Use it**  
   Enter a query (e.g. *KRAS inhibitor in colorectal cancer*), click **Analyze**, and review the stability score, outcome distribution, model-type breakdown, and AI summary.

## How it works

- **Input:** Drug, mutation, or cancer type (e.g. *PD-1 NSCLC*, *BRAF melanoma*).
- **PubMed:** Fetches up to 40 relevant abstracts via NCBI E-utilities.
- **Extraction:** Each abstract is analyzed by the LLM for outcome (positive/negative/mixed), model type (cell line / mouse / human), resistance, subgroup effects, sample size, and confidence.
- **Scoring:** A fragility score (0–100) is computed from negative study ratio, human validation %, resistance and subgroup flags, and sample size.
- **Output:** Dashboard with score, risk badge (High / Moderate / Stable), bar chart of outcomes, pie chart of model types, and an AI-generated summary with red flags, strengths, and suggested due-diligence questions.

## Tech stack

- **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS**
- **PubMed** via NCBI E-utilities (no API key)
- **OpenAI** (gpt-4o-mini) for extraction and summary
- **Recharts** for visualizations

## MetaMap AI

A second app in this repo. **Main idea:** predict **where** metastasis is spreading—which organ (e.g. liver, lung, bone, brain)—so care teams can target surveillance and treatment earlier.

- **Route:** [http://localhost:3000/metamap](http://localhost:3000/metamap)
- **Today’s demo:** Benign vs malignant as a foundation (current dataset has no organ/site labels). Organ-level prediction is the product direction and requires datasets with metastasis location.
- **Data:** Breast Cancer Wisconsin (Diagnostic) from UCI; malignant = higher metastasis risk proxy.
- **Model:** Random Forest (JavaScript, `ml-random-forest`), 80/20 train–test, standardized features.
- **Output:** Probability, risk tier (Low / Medium / High), risk drivers, care plan. No Python; dataset is fetched from UCI when you first load the MetaMap page.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production server
