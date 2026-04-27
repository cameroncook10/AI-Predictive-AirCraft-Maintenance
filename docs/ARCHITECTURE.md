# AeroMind — High-level architecture

Mermaid diagrams: render in GitHub, VS Code, or [mermaid.live](https://mermaid.live).

This view matches the product shape: **maintenance crew** → **browser app** → **FastAPI** → **local persistence** and **Google Gemini**. There is **no** load balancer or TLS-terminating edge in the diagram. Implementation details (dev server, proxy, ports) live in `package.json` and `client/vite.config.js`.

---

## 1. System context

```mermaid
flowchart TB
  subgraph People["Maintenance crew"]
    L["Line & ramp techs (tablets / rugged laptops, org Wi-Fi or VPN)"]
    P["Planners & lead inspectors (corporate or shop laptops)"]
    W["Walk-around / line of sight (phone or tablet for exterior and zone capture)"]
  end

  subgraph Device["Crew device"]
    SPA["React app + api.js overview, capture, inspections, manuals, work orders, AI assistant"]
  end

  subgraph Back["AeroMind API — Python FastAPI"]
    Main["app/main.py CORS + API routes"]
    fleet["fleet aircraft, camera, manuals, inspections, WOs, zones"]
    fr["frames ingest + serve"]
    analysis["analysis exterior / pending (Gemini vision)"]
    res["results list stored"]
    chat["chat AeroMind assistant (Gemini text)"]
    Main --> fleet
    Main --> fr
    Main --> analysis
    Main --> res
    Main --> chat
  end

  subgraph Store["Persistent application storage"]
    ZC["zone_captures + manifests"]
    FZ["frame & zone image files"]
    RJ["results store (JSONL)"]
  end

  subgraph Ext["External SaaS API"]
    G["Google Gemini (vision + chat)"]
  end

  L --> SPA
  P --> SPA
  W --> SPA
  SPA --> Main
  fleet --> ZC
  fr --> FZ
  analysis --> RJ
  res --> RJ
  analysis --> G
  chat --> G
```

---

## 2. Request flow (logical)

*No infrastructure names — just the hop order the app is built around.*

```mermaid
sequenceDiagram
  participant Crew as Maintenance crew
  participant UI as React + api.js
  participant API as FastAPI
  participant Gemini as Google Gemini

  Crew->>UI: use dashboard, capture, inspections, AI
  UI->>API: HTTP calls from the browser
  API->>Gemini: vision / chat (when features run)
  Gemini-->>API: model output
  API-->>UI: JSON responses
  UI-->>Crew: UI update
```
