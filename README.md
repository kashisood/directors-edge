# Director's Edge — Engineering Leadership Interview Prep

A one-stop, static study hub for **Engineering Director / senior software leadership** interviews.
It's built to shape how you *think and talk* like a technical leader — not just to hand you answers.

Live site: _enable GitHub Pages and your URL will appear here, e.g._ `https://<your-username>.github.io/<repo-name>/`

## What's inside

| Page | Covers |
|------|--------|
| **Home** (`index.html`) | The director mindset, how to use the site, the vocabulary of seniority |
| **Fundamentals** | What a director owns, trade-off thinking, core technical concepts, metrics literacy |
| **System Design** | Vertical/horizontal scaling, load balancing, caching, BCP, DR, RTO/RPO — with diagrams |
| **Tech Radar** | Current Java, Spring Boot, and AI (agentic coding, RAG, MCP) from a leader's view |
| **Leadership & Delivery** | Team management, project management, release/delivery, DORA metrics |
| **Security** | Secrets & API keys, authentication vs authorization, OAuth/OIDC, everyday practices |
| **Behavioral** | STAR method, story bank, situational scenarios, trick/trap questions |

Each page includes plain-language explanations, **"Say it like a director"** phrasing boxes,
collapsible practice questions with a live search/filter, and a dark/light theme toggle.

## Tech

Plain HTML, CSS, and vanilla JavaScript. **No build step, no database, no dependencies.**
Just open `index.html` in a browser, or host the folder anywhere static files are served.

```
.
├── index.html
├── fundamentals.html
├── system-design.html
├── tech-radar.html
├── leadership.html
├── security.html
├── behavioral.html
├── assets/
│   ├── css/styles.css
│   └── js/main.js
├── .nojekyll
└── README.md
```

## Run locally

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Host on GitHub Pages (free)

1. Create a new GitHub repository and upload these files.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. Save. After a minute your site is live at `https://<your-username>.github.io/<repo-name>/`.

---

Built as a personal prep hub. Fork it, edit the text, make it yours.
