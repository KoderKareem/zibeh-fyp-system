# Web-Based Final Year Project Repository & Approval Management System
### Feature List + Vibecoding Roadmap — Zibeh Institute of Technology

---

## 1. System Actors — LOCKED

Three roles only. No HOD/Coordinator layer.

- **Student** — submits and tracks project topics
- **Supervisor** — reviews and approves/rejects submissions
- **Admin** — manages users, oversees the whole system, curates the repository (including backfilling past years' projects)

---

## 1.5 Scope Lock — Decisions

After comparing against a second AI's suggestions, these are the final calls:

**Added to the build:**
- Repository access control: public vs. logged-in-only for full document/source code
- Academic session/year config (e.g. "2025/2026") for organizing and filtering the repository
- Citation generator (APA/IEEE) — cheap to build, adds polish
- **Admin can manually add past years' projects to the repository**, independent of the live student-submission flow — this is how you backfill projects that existed before the system
- **Batch topic submission (3 at once)** — matches Zibeh's actual process: student submits 3 topic options together as one package; supervisor approves exactly one or rejects the whole set (no partial keep). This was originally cut as "multi-option submission" but it's actually a specific approval rule, not open-ended scope — reversed after confirming the real workflow.

**Deliberately cut (scope creep risks, not worth the time against your actual abstract):**
- Open-ended "pick any number of alternative titles" submission — replaced by the fixed 3-at-once batch rule above, which is simpler to build because the logic is fixed instead of variable
- Full chapter-by-chapter document submission with version history, in-browser PDF annotation, and milestone scoring — this turns the app into a supervision/grading platform, which is a different project from "topic submission, approval, and repository access." Biggest scope-creep risk to avoid.
- In-app messaging/comment threads per chapter — depends on the chapter-tracking feature above, cut with it
- Batch CSV import for admin — convenient at scale, irrelevant for a small demo dataset
- Separate plagiarism/similarity tool — redundant with the duplicate-check feature already in scope

**Budget:** $0 beyond your existing Claude Pro subscription. Claude Code is included in Pro at no extra cost (shared usage pool with claude.ai chat). Next.js, Supabase, Vercel, and GitHub are all free at this project's scale — Supabase Storage handles file uploads instead of paid options like AWS S3.

**Stack:** no institutional requirement — free choice confirmed. Sticking with the Next.js + Supabase + Vercel recommendation from before.

---

## 2. Full Feature List

### A. Authentication & Access Control
- Registration/login for students and supervisors (admin accounts created manually, not self-registered)
- Role-based dashboards (each role sees a different home screen)
- Password reset
- Session handling / logout

### B. Student Module
- Submit **3 alternative project topics at once** as one package (title + short description/abstract + keywords for each), matching Zibeh's actual process
- Search the repository before submitting, to check if similar topics already exist — duplicate check runs against all 3 titles
- Track the status of the whole package: Pending / One Approved / Rejected (all 3)
- View supervisor's comment on the package (why it was rejected, or which topic was approved and why)
- If rejected, submit a fresh set of 3 — no partial keep from the previous set
- View own submission history
- Get notified when status changes

### C. Supervisor Module
- See a list of topic packages (sets of 3) assigned to them
- Review all 3 topics in a package together, then either **approve exactly one** or **reject the whole set** — comment is mandatory either way (why this one was picked, or why all 3 didn't fit)
- View a student's full submission history (all packages they've submitted, past and current)
- Simple dashboard: pending packages count, approved count

### D. Admin Module
- Manage users (create/edit/deactivate students & supervisors)
- Assign or reassign supervisors to students or departments
- Manage departments/programs list
- Oversight dashboard: view/filter all submissions by status, department, supervisor, session/year
- Manage the repository (add metadata for approved projects, upload the final project document)
- **Add archival entries for past years' projects directly** — no student account or submission workflow required, so pre-existing projects can be backfilled into the repository
- Basic reports: submissions per session, approval rate, most active supervisors
- System settings: open/close the submission window, set deadlines

### E. Repository (this is your differentiator — don't skimp here)
- Searchable list of previously approved projects
- Filters: keyword, department, year/session, supervisor
- View abstract; download full document if access is allowed
- **Duplicate/similarity check** when a new topic is submitted — a simple keyword/title match is enough for FYP scope; true NLP similarity is a stretch goal, not a requirement

### F. Cross-cutting features
- Notifications (in-app is enough; email is a nice-to-have)
- Audit trail — who approved/rejected what, and when (this is easy to add and looks great in your defense)
- Responsive design (works on phone — panels often check on mobile)
- Basic security: hashed passwords, role-based access checks on every page/route, input validation

### G. Stretch goals (only if Phase 1–6 below are done early)
- Smarter similarity detection (basic text-matching algorithm, e.g. comparing title/keyword overlap)
- Comment threads between student and supervisor (not just one comment per action)
- Export reports to PDF/Excel
- Two-factor authentication

**Rule of thumb:** everything in A–F is what your abstract promises. G is what turns a "good" defense into an "excellent" one — build it only after A–F work end to end.

---

## 3. Is Vibecoding This Realistic?

Yes. This is a textbook CRUD app: users, roles, forms, approval workflow, search. It doesn't need anything exotic (no real-time chat, no payments, no complex ML). This exact shape of project is one of the best-suited categories for AI-assisted coding.

Two honest caveats:
1. **You still need to understand what was built**, even if you didn't type every line. Your panel will ask you to explain your database structure, your approval flow, maybe walk through the code. "The AI wrote it" is not an acceptable answer at defense — but "I designed it, described each feature, and directed the AI to build it, and here's how it works" is completely fine and increasingly normal.
2. **Vibecoding works best in small, testable steps.** Asking for the whole system in one prompt produces something fragile and hard to debug. Build one feature, test it, then move to the next.

---

## 4. Recommended Tech Stack

Confirm with your project supervisor first — some Nigerian polytechnic/NBTE departments expect a specific stack (PHP/MySQL is still common in project guidelines). If you have free choice, this stack is the easiest to vibecode successfully:

| Layer | Tool | Why |
|---|---|---|
| Frontend + Backend | **Next.js** (React) | One codebase, AI tools are very fluent in it, huge amount of training data behind it |
| Database + Auth | **Supabase** (Postgres) | Free tier, gives you a database AND ready-made login/role system, so you don't hand-build authentication |
| Hosting | **Vercel** | Free, deploys straight from GitHub, panel can access your live link |

If you want something even more beginner-friendly for the *very first prototype*, tools like **Lovable** or **bolt.new** let you describe the app in plain English and generate a working version connected to Supabase — good for exploring the UI fast, though you'll likely want to move to a real codebase (Next.js) once it gets complex, so you have full control for the parts your panel will scrutinize.

---

## 5. Step-by-Step Roadmap (Zero Prior Experience)

### Phase 0 — Before writing any code
1. Confirm the required tech stack with your supervisor (don't skip this — redoing the stack mid-project is painful)
2. Draw your system design docs first: ERD (entities: Users, Roles, Departments, Submissions, Comments, Notifications), use case diagram, and a simple flowchart of the approval process. Do this on paper/diagram tool before coding — it becomes your Chapter 3 *and* your prompt plan.
3. Create accounts: GitHub, Supabase, Vercel

### Phase 1 — Environment setup
1. Install Node.js and VS Code
2. Install Git, create a GitHub repository for the project
3. Set up Claude Code (see note below) as your main build tool

### Phase 2 — Build order (one feature at a time, test after each)
1. Project skeleton + database schema (from your ERD)
2. Authentication + role-based routing (student/supervisor/admin see different dashboards)
3. Student: submit topic + view own submissions
4. Repository search + duplicate check (build this early — it's your core feature)
5. Supervisor: view assigned submissions, approve/reject/comment
6. Admin: user management, department management, oversight dashboard
7. Notifications
8. Audit log
9. UI polish + responsive check
10. Full manual test of all three user flows
11. Deploy to Vercel

### Phase 3 — How to actually prompt (the "vibecoding" part)
- Paste your ERD/feature list to the AI tool at the start of each session for context
- Ask for **one module at a time** ("build the student submission form and its API route," not "build the whole app")
- Run and click through the app after every change — don't stack five unverified features
- Commit to GitHub after each feature works — this is your undo button
- Ask the AI to briefly explain what it built, so you can speak to it later

### Phase 4 — Documentation & defense prep
- Take screenshots as you go for your report chapters (don't leave this to the end)
- Be ready to explain: your ERD, the approval workflow, how duplicate-checking works, and your security choices
- Do a full dry-run demo before the real defense

---

## 6. Matching Zibeh's Visual Identity

**Extracted from the homepage screenshot (August 2026):**

| Element | Value |
|---|---|
| Primary accent | Bright sky/cerulean blue, approx. `#1E9BD7`–`#2E9FE5` — buttons, links, logo, small section labels |
| Headings & footer | Deep navy, approx. `#14213D` |
| Course card background | Pale mint-white, approx. `#EFFAF3` (not plain white) |
| "Strengths" card background | Pale blue, approx. `#E8F6FC` |
| Headings font | Bold, rounded, geometric sans-serif (Poppins/Montserrat-style) |
| Body font | Lighter, clean sans-serif |
| Signature patterns | Pill-shaped buttons (heavy corner rounding); centered section titles under a small uppercase label flanked by short dashes (e.g. "— ABOUT US —"); card-grid layouts throughout; generous rounded corners on every card/image |

These are visual estimates, close enough for a consistent-feeling dashboard. If Claude Code needs pixel-exact hex values later, pull them the manual way:
1. Open zibeh.ng in Chrome, right-click any element → **Inspect**
2. In DevTools' Elements panel, click a `background-color` or `color` swatch to open the color picker — it shows the exact hex code
3. Check the **Computed** tab for `font-family` to get the typeface name
4. Grab the logo directly: `https://zibeh.ng/static/img/ZITLOGO-1.png`

Hand this table to Claude Code as: *"Match this color palette and type style, but design your own layout for a dashboard/form-heavy app — don't copy the marketing site's layout, just its brand identity."*

---

## 7. Working with Claude Code — Communication & Workflow Rules

Locked after reviewing a couple of "master prompt" templates found online:

- **Plain English only.** Claude Code should explain what it built and why in terms of what you can see, click, or decide — not code internals, unless you ask.
- **Interview before building each major piece.** Before starting a feature, it should ask you clarifying questions about behavior/appearance (using its structured question tool where possible), not guess. Technical implementation choices are its call.
- **No blanket "bypass permissions."** Some found-online prompts suggest disabling all safety checkpoints so it never stops to confirm anything. Rejected — with zero ability to read code, that checkpoint is your safety net, not friction. The actual rule: it can work without nagging you over every file edit, but it always stops and shows you after each feature (matches the git-commit-per-feature plan in Phase 3 below).
- **Row Level Security (RLS) is the real enforcement mechanism** for "students only see their own data" — this is a Supabase feature, not just an app-level check. Make sure it's explicitly turned on, not assumed.
- **Hosting stays Vercel**, not Netlify — already the better pairing for Next.js, no reason to switch.

---

## 8. Realistic Timeline

For a solo build alongside your other commitments (Dab Media work, coursework), 6–10 weeks is reasonable:
- Weeks 1–2: design docs, environment setup, schema, auth
- Weeks 3–5: student + supervisor + repository features
- Week 6: admin module
- Week 7: notifications, audit log, polish
- Week 8–9: testing, deployment, documentation
- Week 10: buffer + defense prep
