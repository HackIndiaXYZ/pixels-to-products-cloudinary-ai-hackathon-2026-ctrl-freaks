# RAW → REUSE · Circular Construction Salvage Engine

> **Cloudinary AI Hackathon 2026 Submission** | **Track 3: Pixels to Products**  
> **Team:** CTRL Freaks  
> **Live Production App:** [https://pixels-to-products-cloudinary-ai-ha-kappa.vercel.app/](https://pixels-to-products-cloudinary-ai-ha-kappa.vercel.app/)

---

## 🌟 Overview

**RAW → REUSE** transforms deconstruction site photos into high-value upcycled product opportunities. Built specifically for deconstruction contractors, salvage specialists, and circular architects, RAW → REUSE turns raw site imagery into actionable material inventories and generative upcycling concepts.

By connecting **Cloudinary AI Vision** and **Cloudinary Generative Transformations**, RAW → REUSE bridges the gap between demolition waste and sustainable product fabrication.

---

## 🚀 Live Demo & Links

- **Deployment URL:** [https://pixels-to-products-cloudinary-ai-ha-kappa.vercel.app/](https://pixels-to-products-cloudinary-ai-ha-kappa.vercel.app/)
- **Repository:** [GitHub Repository](https://github.com/HackIndiaXYZ/pixels-to-products-cloudinary-ai-hackathon-2026-ctrl-freaks)
- **Health Checks:**
  - Storage Health: `/api/health/persistence`
  - AI Vision Health: `/api/health/ai-vision`

---

## ✨ Core Features

1. **Deconstruction Project Workspaces**: Organize site deconstructions by location, project type (Deconstruction, Demolition, Renovation, Fit-out), and timelines.
2. **AI Vision Material Recognition**: Analyze site photos with Cloudinary AI Vision to automatically detect reusable materials (timber beams, solid doors, architectural steel, lighting fixtures), visual damage, condition, and AI confidence scores.
3. **Generative Concept Studio**: Create visual upcycling concepts (modular partition screens, bespoke tables, architectural wall cladding) using Cloudinary Generative transformations.
4. **Opportunity Matching Engine**: Match reclaimed site materials with incoming buyer reuse requests using visual geometry compatibility scoring.
5. **Durable Serverless Cloudinary Persistence**: Per-entity signed raw JSON storage (`raw-reuse/db/`) that persists across isolated serverless Vercel function invocations without database overhead.

---

## 🛠️ Cloudinary Capabilities Integrated

| Feature | Cloudinary API / Add-on | Purpose |
| :--- | :--- | :--- |
| **Site Photo Storage** | Cloudinary Media Library & Signed Upload API | Secure, high-resolution site photo storage with project tags |
| **Material Recognition** | Cloudinary AI Vision (`ai_vision_general`) | Detect material types, visible damage, integrity, and quantity estimates |
| **Automated Tagging** | Cloudinary AI Vision (`ai_vision_tagging`) | Apply automated taxonomy tags to media assets |
| **Upcycle Concept Generation** | Cloudinary Generative AI API | Produce generative transformed product concepts from reclaimed materials |
| **Raw JSON Persistence** | Cloudinary Raw Storage API | Store per-entity JSON records (`projects`, `materials`, `media`, `concepts`) |

---

## 💻 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Server-Side Rendering)
- **Language:** TypeScript
- **Styling:** Custom Vanilla CSS Design System with dark mode, glassmorphism, and responsive layout
- **Cloud Infrastructure:** Vercel Serverless Functions
- **Media & AI Layer:** Cloudinary Node.js SDK & REST APIs

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- Node.js 18+ installed
- A Cloudinary account with API Credentials

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run type check
node node_modules/typescript/bin/tsc --noEmit

# Run production build
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore RAW → REUSE.

---

## 🛡️ Architecture & Reliability

- **No Fake Data Fallbacks**: When AI Vision processes an image, results are strictly grounded in real model output. Failed analysis allows user retry without inserting mock data.
- **Credential Security**: `CLOUDINARY_API_SECRET` is strictly confined to server-side executions (`server-only`). Signed uploads use short-lived signatures.
- **Serverless Resilience**: Cloudinary Raw JSON storage preserves project, material, request, and concept records across separate Vercel executions.

---

## 📜 License

Created for the **Cloudinary AI Hackathon 2026** by team **CTRL Freaks**.
