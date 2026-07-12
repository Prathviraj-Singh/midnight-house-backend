# Sprint 1 Project Initialization Guide
## Full-Stack Setup: Step-by-Step Command and Configuration Log

This guide details the exact steps to scaffold the **Midnight House** platform. Follow these terminal commands and configurations sequentially.

---

## 1. Directory Structure Scaffolding & Git Control

To support clean isolation between the Next.js client application and the Django REST Framework API, we use a single root repository container with isolated client and API directories.

### Step 1.1: Create Project Root
Open PowerShell (on Windows) or your command shell and execute:
```powershell
mkdir C:\Users\prath\.gemini\antigravity\scratch\midnight-house
cd C:\Users\prath\.gemini\antigravity\scratch\midnight-house
```
* **Why**: This creates a dedicated root project workspace `midnight-house` in your local scratch directory.

### Step 1.2: Git Control Initialization
Configure version control:
```powershell
git init
```
* **Why**: Instantiates Git local tracking, enabling branch control and commit rollback checks.

### Step 1.3: Generate Gitignore Configuration
Create a `.gitignore` text file in the `midnight-house` root directory:
```
# Virtual Environments
.venv/
venv/
env/

# Python caching & DB files
__pycache__/
*.py[cod]
*$py.class
db.sqlite3

# Frontend dependencies & logs
node_modules/
.next/
out/
npm-debug.log*

# Environment config containing secrets
.env
.env.local
```
* **Why**: Prevents heavy, dynamic node libraries, virtual env environments, and API secret files from syncing with public source repositories.

---

## 2. Database (PostgreSQL) Local Configuration

We use PostgreSQL because our private theater slots and scheduling database models require transactional integrity and row-locking features to avoid double-bookings.

### Step 2.1: Open pgAdmin or SQL Shell (psql)
* Open the SQL Shell application from your Windows Start Menu, or execute this in your CLI to log in as default database administrator:
  ```powershell
  psql -U postgres
  ```
* Enter your system admin credentials.

### Step 2.2: Execute DB Initialization SQL
Run these SQL queries to instantiate the user and database:
```sql
-- 1. Create a dedicated database administrator role
CREATE USER midnight_admin WITH PASSWORD 'secure_db_password';

-- 2. Create the system database schema container
CREATE DATABASE midnight_house_db OWNER midnight_admin;

-- 3. Grant full capabilities to the new role
GRANT ALL PRIVILEGES ON DATABASE midnight_house_db TO midnight_admin;
```
* **Why**: Running the application as an administrative superuser (`postgres`) violates security best practices. Isolating database operations under `midnight_admin` limits database privileges.

---

## 3. Backend & Django Framework Scaffolding

### Step 3.1: Python Virtual Environment Initialization
From the root of `midnight-house`, run:
```powershell
python -m venv .venv
```
* **Why**: Isolates python dependencies specifically for this project, avoiding global package version conflicts on your Windows machine.

### Step 3.2: Activate Virtual Environment
* **On Windows PowerShell**:
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
* **On Windows Command Prompt (cmd)**:
  ```cmd
  .venv\Scripts\activate.bat
  ```
* **Why**: Switches the active python interpreter context to the isolated `.venv` directory. You will see a `(.venv)` prompt prefix in your terminal.

### Step 3.3: Install Backend Requirements
Install dependencies and freeze settings:
```powershell
pip install django djangorestframework djangorestframework-simplejwt psycopg2-binary django-cors-headers python-dotenv pillow
pip freeze > requirements.txt
```
* **Why**:
  * `django`: Core MVC backend framework.
  * `djangorestframework`: Core REST mapping framework.
  * `simplejwt`: JSON Web Token authentication library.
  * `psycopg2-binary`: Database driver enabling Python to speak with PostgreSQL.
  * `django-cors-headers`: Allows frontend Next.js requests to communicate with our API.
  * `python-dotenv`: Parses `.env` configuration files.
  * `pillow`: Image processing library required for Django file upload model fields.

### Step 3.4: Scaffold Django Configuration File Layout
Scaffold the Django file structure inside the root directory:
```powershell
django-admin startproject config .
```
* **Why**: Generates the baseline Django project files. The trailing dot (`.`) forces Django to initialize the config folder directly in the active root directory instead of wrapping it inside an additional sub-folder.

### Step 3.5: Settings Directory Segregation
Rename `settings.py` to support development environment profiles:
```powershell
# 1. Create settings container folder
mkdir config\settings

# 2. Move original settings file to serve as base config blueprint
move config\settings.py config\settings\base.py

# 3. Create empty initialization package file
New-Item config\settings\__init__.py -ItemType File

# 4. Create development settings configurations file
New-Item config\settings\local.py -ItemType File
```

* Open `config/settings/local.py` in your text editor and append:
  ```python
  from .base import *

  DEBUG = True
  SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'default-dev-secret-key-9999')
  ALLOWED_HOSTS = ['*']

  DATABASES = {
      'default': {
          'ENGINE': 'django.db.backends.postgresql',
          'NAME': 'midnight_house_db',
          'USER': 'midnight_admin',
          'PASSWORD': 'secure_db_password',
          'HOST': '127.0.0.1',
          'PORT': '5432',
      }
  }
  ```
* Update `manage.py` and `config/wsgi.py` setting pointers from `'config.settings'` to `'config.settings.local'`.

### Step 3.6: Apps Scaffolding Setup
Construct directories for app domains:
```powershell
mkdir apps
cd apps
django-admin startapp users
cd ..
```
* Open `apps/users/apps.py` and adjust the configuration namespace class:
  ```python
  from django.apps import AppConfig

  class UsersConfig(AppConfig):
      default_auto_field = 'django.db.models.BigAutoField'
      name = 'apps.users'
  ```
* Open `config/settings/base.py` and add `'apps.users'` and `'rest_framework'` inside the `INSTALLED_APPS` list.

---

## 4. Frontend & Next.js Framework Scaffolding

### Step 4.1: Scaffold Next.js Workspace
From the `midnight-house` root directory, execute:
```powershell
npx -y create-next-app@latest frontend --typescript --tailwind --app --src-dir --eslint --import-alias "@/*"
```
* **Why**: Instantiates a React Next.js project container inside `frontend/` utilizing:
  * `--typescript`: TypeScript static type validation checks.
  * `--tailwind`: Utility styling engine.
  * `--app`: React App router structures.
  * `--src-dir`: Scaffolds all source files inside `/src` to clean configuration layers.

### Step 4.2: Shadcn UI Configuration
Enter the frontend directory and initialize Shadcn:
```powershell
cd frontend
npx -y shadcn-ui@latest init
```
* **Why**: Configures Tailwind rules and installs configuration wrappers supporting pre-built accessible components.
* Install design primitives:
  ```powershell
  npx -y shadcn-ui@latest add button input form card alertDialog
  ```

### Step 4.3: Install Frontend Communication Utilities
Install client request processing components:
```powershell
npm install axios lucide-react framer-motion
```
* **Why**:
  * `axios`: Configures headers, base URLs, and allows HTTP-only cookies verification.
  * `lucide-react`: Lightweight vector design iconography pack.
  * `framer-motion`: Handles animation triggers and transitions.

---

## 5. Local Environment Variables Setup

Create your environment configuration files locally.

### Step 5.1: Create Backend Variables
Create a file named `.env` in the `midnight-house` root folder:
```ini
DJANGO_SECRET_KEY=yoursecretkeyhere
DEBUG=True
DB_NAME=midnight_house_db
DB_USER=midnight_admin
DB_PASSWORD=secure_db_password
DB_HOST=127.0.0.1
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Step 5.2: Create Frontend Variables
Create a file named `.env.local` inside `midnight-house/frontend/`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 6. Cloudinary Configuration Setup

Cloudinary handles cloud storage of student ID credentials and image uploads from the Admin panel.

### Step 6.1: Registration
* Sign up for a free account at [Cloudinary](https://cloudinary.com).

### Step 6.2: Retrieve API Keys
* Access your Cloudinary Dashboard and locate:
  1. **Cloud Name**
  2. **API Key**
  3. **API Secret**

### Step 6.3: Append keys to Backend Configuration
Add these credentials to your backend `.env` file:
```ini
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 7. Local Development Workflow

Run both servers concurrently to check the connection.

### Command Window A: Start Backend API Server
* Open a new terminal window, activate virtual environment, and launch:
  ```powershell
  cd midnight-house
  .venv\Scripts\Activate.ps1
  python manage.py runserver 127.0.0.1:8000
  ```
* **Check**: Visit `http://127.0.0.1:8000` to verify Django configuration runs.

### Command Window B: Start Next.js Development Server
* Open a separate terminal window, navigate to the frontend directory, and run:
  ```powershell
  cd midnight-house\frontend
  npm run dev
  ```
* **Check**: Visit `http://localhost:3000` to verify Next.js compiles correctly.
