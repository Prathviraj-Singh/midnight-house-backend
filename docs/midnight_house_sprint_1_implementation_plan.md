# Sprint 1 Detailed Implementation Plan
## Step-by-Step Execution Guide for Beginners

---

## 1. Project Initialization Tasks

Perform these steps first to set up the repository.

1. **Create the Project Directory**:
   * Open your terminal and create a root directory for the project:
     ```bash
     mkdir midnight-house
     cd midnight-house
     ```
2. **Initialize Git**:
   * Initialize a git repository to track your work:
     ```bash
     git init
     ```
3. **Configure Gitignore**:
   * Create a `.gitignore` file in the root directory to prevent checking in node modules, virtual environments, environment files, and database files:
     ```
     # Virtual Environment
     .venv/
     venv/
     ENV/
     env/

     # Python / Django
     *.pyc
     __pycache__/
     db.sqlite3
     media/
     .env

     # Frontend Node/Next.js
     node_modules/
     .next/
     out/
     .env.local
     .env.development.local
     .env.test.local
     .env.production.local
     npm-debug.log*
     yarn-debug.log*
     yarn-error.log*

     # IDE & System
     .vscode/
     .idea/
     .DS_Store
     Thumbs.db
     ```

---

## 2. Database Setup Tasks

Set up PostgreSQL before starting the backend, as Django will check for a database connection.

1. **Install PostgreSQL**:
   * Download and install PostgreSQL for Windows (recommended: PostgreSQL 15 or 16).
   * Note down the port (default is `5432`) and the default admin user password (`postgres`).
2. **Create Database and User**:
   * Open pgAdmin or open your terminal and run SQL commands to create a user and database:
     ```sql
     CREATE USER midnight_admin WITH PASSWORD 'secure_db_password';
     CREATE DATABASE midnight_house_db OWNER midnight_admin;
     GRANT ALL PRIVILEGES ON DATABASE midnight_house_db TO midnight_admin;
     ```

---

## 3. Backend Setup Tasks

Now, initialize the Django backend.

1. **Create Virtual Environment**:
   * Inside the `midnight-house` root directory, create a Python virtual environment:
     ```bash
     python -m venv .venv
     ```
   * Activate the virtual environment:
     * **Windows Command Prompt (cmd)**: `.venv\Scripts\activate.bat`
     * **Windows PowerShell**: `.venv\Scripts\activate.ps1`
2. **Install Dependencies**:
   * Install the necessary packages:
     ```bash
     pip install django djangorestframework djangorestframework-simplejwt psycopg2-binary django-cors-headers python-dotenv pillow
     ```
   * Save dependencies:
     ```bash
     pip freeze > requirements.txt
     ```
3. **Initialize Django Project**:
   * Create a Django project named `config` in the current folder:
     ```bash
     django-admin startproject config .
     ```
4. **Restructure Settings**:
   * Create a settings folder to handle base, local, and production settings:
     * Create folder `config/settings/`
     * Move `config/settings.py` into `config/settings/base.py`
     * Create an empty `__init__.py` inside `config/settings/`
     * Create `config/settings/local.py` for development configurations.
     * Create `config/settings/production.py` for secure deployment settings.
   * Edit `manage.py` and `config/wsgi.py` to use `config.settings.local` as the default settings module instead of `config.settings`.
     * Update the string `'config.settings'` to `'config.settings.local'`.
5. **Configure `local.py` settings**:
   * Open `config/settings/local.py` and add the development parameters:
     ```python
     from .base import *

     DEBUG = True
     SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key-12345')
     ALLOWED_HOSTS = ['*']

     DATABASES = {
         'default': {
             'ENGINE': 'django.db.backends.postgresql',
             'NAME': 'midnight_house_db',
             'USER': 'midnight_admin',
             'PASSWORD': 'secure_db_password',
             'HOST': 'localhost',
             'PORT': '5432',
         }
     }
     ```
6. **Set up Apps Structure**:
   * Create an `apps/` folder in the root directory to bundle all applications:
     ```bash
     mkdir apps
     ```
   * Create the custom user authentication app inside the `apps` directory:
     ```bash
     cd apps
     django-admin startapp users
     cd ..
     ```
   * Update the `AppConfig` class in `apps/users/apps.py` to specify its namespace path:
     ```python
     # apps/users/apps.py
     from django.apps import AppConfig

     class UsersConfig(AppConfig):
         default_auto_field = 'django.db.models.BigAutoField'
         name = 'apps.users'
     ```
   * Add `'apps.users'` and `'rest_framework'` to `INSTALLED_APPS` in `config/settings/base.py`.

---

## 4. Authentication & User Setup Tasks

Implement the database user schemas and security token configuration.

1. **Define User and UserProfile Models**:
   * Open `apps/users/models.py` and define:
     * A class `User` extending Django's `AbstractBaseUser` and `PermissionsMixin`. It must use `email` as the username field.
     * Add fields: `email`, `phone_number`, `first_name`, `last_name`, `is_student_verified`, `is_staff`, `is_active`, `created_at`.
     * A class `UserProfile` extending `models.Model` with a one-to-one relationship to `User`, `student_id_image_url`, and `default_delivery_address`.
2. **Register Custom User Model**:
   * In `config/settings/base.py`, register the custom user model:
     ```python
     AUTH_USER_MODEL = 'users.User'
     ```
3. **Execute Initial Migrations**:
   * Run database migrations to construct the database tables:
     ```bash
     python manage.py makemigrations users
     python manage.py migrate
     ```
4. **Configure JWT Settings**:
   * Add JWT parameters in `config/settings/base.py`:
     ```python
     from datetime import timedelta

     REST_FRAMEWORK = {
         'DEFAULT_AUTHENTICATION_CLASSES': (
             'rest_framework_simplejwt.authentication.JWTAuthentication',
         ),
     }

     SIMPLE_JWT = {
         'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
         'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
         'ROTATE_REFRESH_TOKENS': True,
         'BLACKLIST_AFTER_ROTATION': True,
         'AUTH_HEADER_TYPES': ('Bearer',),
     }
     ```
5. **Create Cookies Authentication Handler Views**:
   * Open `apps/users/views.py` and implement views:
     * `RegisterView`: Receives user input (email, password, phone, first_name, last_name), hashes password, creates User, and creates UserProfile.
     * `LoginView`: Checks credentials. If valid, generates Simple JWT access and refresh tokens. Appends them as cookies in the response:
       * Set `access_token` cookie with `httponly=True`, `samesite='Lax'`, and expiry of 15 minutes.
       * Set `refresh_token` cookie with `httponly=True`, `samesite='Lax'`, and path limited to `/api/v1/auth/token/refresh/` with expiry of 7 days.
     * `LogoutView`: Clears `access_token` and `refresh_token` cookies by setting their values to empty and max_age to 0.
6. **Set up Custom JWT Cookie Authenticator**:
   * Create an authentication class inside `apps/users/authentication.py` that intercepts incoming requests, reads the `access_token` cookie value, and validates it against Simple JWT.
7. **Map Authentication Routes**:
   * Add URLs to `apps/users/urls.py` and map them to `config/urls.py` under the prefix `api/v1/auth/`.

---

## 5. Frontend Setup Tasks

Initialize and style the frontend shell.

1. **Scaffold Next.js Project**:
   * In the `midnight-house` root directory, initialize Next.js in a folder called `frontend`:
     ```bash
     npx create-next-app@latest frontend --typescript --tailwind --app --src-dir
     ```
     * Choose defaults (Yes to ESLint, Yes to Tailwind, Yes to `src/` directory, Yes to App Router, No to custom import alias).
2. **Install Shadcn UI**:
   * Move into the `frontend` folder:
     ```bash
     cd frontend
     ```
   * Initialize Shadcn UI:
     ```bash
     npx shadcn-ui@latest init
     ```
     * Choose default choices (Default style, Slate base color, Yes to CSS variables).
   * Install necessary components (Button, Input, Form, Card, Alert):
     ```bash
     npx shadcn-ui@latest add button input form card alert
     ```
3. **Install Client Dependencies**:
   * Install Axios for HTTP requests and Lucide Icons:
     ```bash
     npm install axios lucide-react framer-motion
     ```
4. **Configure Theme Colors**:
   * Update `src/app/globals.css` or Tailwind settings to reflect the Midnight Cafe color scheme:
     * Dark charcoal background (`#121212` or similar HSL coordinates).
     * Vibrant amber/gold accents (`#D4AF37`) for highlights.
5. **Setup Axios Client Wrapper**:
   * Create `src/lib/api.ts` to configure Axios. Enable credentials so the browser passes HTTP-only cookies to the backend:
     ```typescript
     import axios from 'axios';

     const api = axios.create({
       baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
       withCredentials: true, // Crucial for cookie-based JWT passing
     });

     export default api;
     ```
6. **Build Views**:
   * Implement simple, polished screens inside `src/app/`:
     * Register view (`/register/page.tsx`): Validation for fields, submits to `/auth/register/`.
     * Login view (`/login/page.tsx`): Submits to `/auth/login/`, saves user metadata to context/state, redirects to Dashboard.
     * Basic dashboard shell page (`/dashboard/page.tsx`): Displays user greeting and logout button.

---

## 6. Environment Variables Templates

Set up your configuration files to avoid hardcoding secrets.

### Backend `.env` (Create in `midnight-house/` root):
```ini
DJANGO_SECRET_KEY=yoursecretkeyhere
DEBUG=True
DB_NAME=midnight_house_db
DB_USER=midnight_admin
DB_PASSWORD=secure_db_password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```
*Load this file in `config/settings/base.py` using `python-dotenv`.*

### Frontend `.env.local` (Create in `midnight-house/frontend/`):
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 7. Third-Party Services Setup (Preparatory)

No third-party SDK integration is required to complete Sprint 1, but tasks should be prepared:
1. **Cloudinary Accounts**: Create a free Cloudinary sandbox account. Retrieve the API Keys (`Cloud Name`, `API Key`, `API Secret`) and document them for Sprint 2.
2. **SMTP/Email Credentials** (Optional): Setup credentials for Gmail SMTP server or Mailgun to handle notification alerts.

---

## 8. Deliverables Checklist

To complete Sprint 1, verify that all items on this list are verified:

- [ ] **DB Connection**: Running `python manage.py migrate` connects to PostgreSQL and creates the user tables.
- [ ] **JWT Handshake**: Making a `POST` request to `/api/v1/auth/login/` returns a `200 OK` response status and includes secure `access_token` and `refresh_token` cookies in the response headers.
- [ ] **Cookie Access**: Requesting the `/api/v1/auth/logout/` endpoint clears the auth cookies.
- [ ] **Protected Routes**: Sending a request to a protected API endpoint without cookies returns `401 Unauthorized`.
- [ ] **Next.js Compilation**: Running `npm run dev` in the frontend directory runs the site with zero compile errors.
- [ ] **Duo Flow Integration**: Registration forms write new users to the PostgreSQL database, and login forms redirect users to the dashboard.
- [ ] **Responsive Forms**: All UI forms render correctly on both mobile and desktop screens.
