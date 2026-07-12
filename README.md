# Midnight House: Your Own Private Space

Midnight House is a premium full-stack digital web platform managing a luxury private experience cafe in Indore (Vijay Nagar, Scheme No. 74). The platform manages slot reservations for a Private Mini Theater (max 8 patrons), Birthday/Farewell packages (max 10 guests), unified food ordering mechanisms (dine-in table service and delivery up to 5 KM), and real-time administrative kitchen boards.

---

## 1. Directory Structure Layout

The project separates the Next.js frontend client from the Django REST Framework backend API in a single monorepo wrapper:

```
midnight/
├── docs/                         # Baseline PRD and Architecture Markdown docs
├── config/                       # Master Django settings and configurations
│   ├── settings/
│   │   ├── base.py               # Shared apps, middleware, and settings
│   │   ├── local.py              # Development PostgreSQL configuration
│   │   └── production.py         # Production cookie safety & static rules
│   ├── urls.py                   # Master routing dispatcher
│   ├── wsgi.py                   # WSGI deployment hook
│   └── asgi.py                   # ASGI channels routing hook
├── apps/                         # Modular business apps container folder
├── frontend/                     # Next.js React client application
│   ├── src/
│   │   ├── app/                  # App router pages, layouts, and styles
│   │   ├── lib/                  # Axios helpers, Shadcn utilities
│   │   └── components/           # Custom reusable Shadcn templates
│   ├── tailwind.config.ts        # Custom Midnight gold themes and colors
│   ├── tsconfig.json             # TypeScript static typing configs
│   └── components.json           # Shadcn system config file
├── deploy/                       # Orchestration container pipelines
│   ├── docker/
│   │   ├── Dockerfile.prod       # Multi-stage python image builder
│   │   └── docker-compose.prod.yml # Production compose orchestration
│   └── nginx/
│       └── nginx.conf            # Proxy routing parameters
├── requirements.txt              # Backend production requirement packages
├── .gitignore                    # Shared environment exclusions mapping
├── PROJECT_UNDERSTANDING.md      # Synthesized specifications overview
└── TASK_BREAKDOWN.md             # Backlog matrix tracking Sprints
```

---

## 2. Setting Up the Environment

### 2.1 Backend Setup & Migration Guide
1. **Navigate to the root directory**:
   Ensure you are in the project root workspace `midnight/`.
2. **Create and activate the virtual environment**:
   ```bash
   python -m venv .venv
   ```
   * **Windows Cmd**: `.venv\Scripts\activate.bat`
   * **PowerShell**: `.venv\Scripts\activate.ps1`
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Locate and populate environment configurations**:
   Verify that a `.env` file exists in your root workspace containing your PostgreSQL parameters:
   ```ini
   DJANGO_SECRET_KEY=yoursecretkeyhere
   DEBUG=True
   DB_NAME=midnight_house_db
   DB_USER=midnight_admin
   DB_PASSWORD=secure_db_password
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```
5. **Establish database structures and verify connection**:
   ```bash
   python manage.py migrate
   ```
6. **Launch the development server**:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   * The backend will run at `http://127.0.0.1:8000/`. You can check the base API status at `http://127.0.0.1:8000/api/v1/`.

---

### 2.2 Frontend Setup & Running Dev
1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```
2. **Install Node packages**:
   ```bash
   npm install
   ```
3. **Verify local environment files**:
   Ensure `frontend/.env.local` contains:
   ```ini
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
4. **Launch Next.js in development mode**:
   ```bash
   npm run dev
   ```
   * The premium user interface compiles and runs at `http://localhost:3000`.

---

## 3. Running Production via Docker Compose

To run the production deployment using our multi-stage Docker environment and Nginx reverse proxy configuration:

1. Move to the docker directory:
   ```bash
   cd deploy/docker
   ```
2. Launch the orchestration pipeline:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```
   * Nginx exposes port `80` (HTTP) and `443` (HTTPS).
   * Static assets and file uploads are shared and served directly by Nginx volumes.
   * Admin panels and API calls (`/api/v1/`) are proxied straight to the Django Gunicorn server.
