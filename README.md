# JobHunt — FastAPI Application Tracker

A sleek, dark-themed job application tracker with a FastAPI backend and a vanilla JS + GSAP frontend. Track every application, watch your pipeline move through a beautiful animated dashboard, and get real insight into where your job search actually stands.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat&logo=javascript&logoColor=black)
![GSAP](https://img.shields.io/badge/GSAP-Animations-88CE02?style=flat&logo=greensock&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## Features

- **Two-tab workspace** — switch instantly between **Tracking** (your live job list) and **Overview** (analytics dashboard), with an animated sliding tab indicator.
- **Full CRUD** — add, edit, and delete applications through a smooth modal form with validation.
- **Live search & filtering** — filter by status (Applied / Interviewing / Offer / Rejected) or search by company/role.
- **Animated analytics** — count-up stat cards, progress bars, and percentage breakdowns powered by GSAP.
- **Interactive Overview dashboard**
  - Success-rate radial gauge (offers ÷ total applications)
  - Source breakdown (LinkedIn, Referral, Naukri, Company Website, etc.)
  - Location breakdown across cities
  - Oldest pending application tracker, with days-waiting counter
- **Micro-interactions** — 3D tilt on job cards, spotlight hover effects, toast notifications, and confetti when you land an offer 
- **Custom cinematic UI** — dark aurora background, floating particle canvas, ambient orb parallax, and a gradient-driven design system.
- **Zero external DB** — data persists to a local `job_applications.json` file, so it runs anywhere with no setup.

---

## Tech Stack

| Layer      | Technology                                  |
|------------|----------------------------------------------|
| Backend    | FastAPI, Pydantic, Python `enum`/`date`       |
| Storage    | JSON file (`job_applications.json`)           |
| Frontend   | HTML5, CSS3 (custom properties), Vanilla JS   |
| Animation  | [GSAP 3](https://gsap.com/)                   |
| Fonts      | Inter, Space Grotesk (Google Fonts)           |

---

## 📁 Project Structure

```
jobhunt/
├── main.py                     # FastAPI app & all API routes
├── job_applications.json       # Local data store (auto-created)
├── templates/
│   └── index.html              # Main UI (served at "/")
└── static/
    ├── style.css                # Theme, layout, animations
    └── index.js                 # Frontend logic & API calls
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- pip

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/Career_Track.git
cd jobhunt

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install fastapi uvicorn pydantic

# 4. Run the server
uvicorn main:app --reload
```

The app will be live at **http://127.0.0.1:8000**
Interactive API docs (Swagger UI) are available at **http://127.0.0.1:8000/docs**

> On first run, if `job_applications.json` doesn't exist, create an empty one:
> ```bash
> echo "{}" > job_applications.json
> ```

---

## API Reference

| Method | Endpoint                        | Description                                  |
|--------|----------------------------------|-----------------------------------------------|
| GET    | `/`                              | Serves the frontend UI                        |
| GET    | `/about`                         | API metadata                                  |
| GET    | `/applications`                  | List all applications                         |
| GET    | `/applications/sort?sort_by=`    | Sort by `role`, `company`, `status`, or `date_applied` |
| GET    | `/applications/stats`            | Aggregated analytics (status, source, location, success rate, oldest pending) |
| GET    | `/applications/filter`           | Filter applications by any field              |
| GET    | `/applications/{id}`             | Get a single application by ID                |
| POST   | `/applications/create`           | Create a new application                      |
| PUT    | `/applications/update/{id}`      | Update an existing application                |
| DELETE | `/applications/delete/{id}`      | Delete an application                         |

### Example: Create an application
```bash
curl -X POST http://127.0.0.1:8000/applications/create \
  -H "Content-Type: application/json" \
  -d '{
        "company": "Google",
        "role": "Backend Engineer",
        "status": "Applied",
        "date_applied": "2026-01-15",
        "location": "Bangalore",
        "application_source": "LinkedIn"
      }'
```

---

## UI Preview

| Tracking Tab | Overview Tab |
|---|---|
| Job cards, search, and status filters | Success rate gauge + source/location breakdown |

*(Add your own screenshots or a short GIF here once deployed.)*

---

## Roadmap

- [ ] Persist data to a real database (SQLite/PostgreSQL)
- [ ] Authentication for multi-user tracking
- [ ] Export applications to CSV/PDF
- [ ] Email/calendar reminders for interviews
- [ ] Dark/light theme toggle

---


<p align="center">Built with FastAPI, GSAP, and a lot of job-search hope. </p>
