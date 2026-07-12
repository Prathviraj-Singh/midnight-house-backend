# Midnight House Development Roadmap
## Engineering Sprint Plan & Execution Roadmap

---

## 1. Executive Timeline Overview

This roadmap breaks down the engineering lifecycles for the **Midnight House** platform into **6 distinct, 2-week sprints** (Total Timeline: 12 Weeks). 

The plan maps a path from repository initialization to a production-ready, mobile-responsive, and scalable deployment. 

```
                                  Timeline (Weeks)
   0         2         4         6         8         10        12
   ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
   │Sprint 1 │Sprint 2 │Sprint 3 │Sprint 4 │Sprint 5 │Sprint 6 │
   └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
   Foundation  Catalog     Theater    Promo &    Admin    Testing &
     & Auth   & Orders    Bookings    Reviews   Console    Launch
```

---

## 2. Sprint Breakdown

### Sprint 1: System Foundations & Authentication Pipeline
* **Goal**: Establish the base repository infrastructure, database setups, and secure authentication flow using JWT HTTP-Only cookies.
* **Backend Tasks**:
  * Scaffolding the Django project structure under `config/` and modularizing settings (`base.py`, `local.py`, `production.py`).
  * Initialize PostgreSQL database connection, configure Django database migrations.
  * Implement Custom User and Profile models.
  * Integrate `djangorestframework-simplejwt` and implement token emission, cookie attachment middleware, and custom JWT authentication class.
  * Build endpoints: Registration, Login, Logout, and Token Refresh.
* **Frontend Tasks**:
  * Set up Next.js app directory structure with TypeScript, Tailwind CSS, and Shadcn UI.
  * Establish layout layouts, routing structure, and design tokens matching the premium, dark-themed styling instructions.
  * Set up state management and API communication interceptor (Axios/Fetch handler with credentials forwarding).
  * Build views: Login page, Sign-up page, and basic Landing page layout shell.
* **Deliverables**:
  * Seeded PostgreSQL instance.
  * Secured Auth endpoints (Auth API) with test suites.
  * Functional login and registration UI forms.
* **Dependencies**: None (Start of Project).

---

### Sprint 2: Digital Catalog & Basic Cart Engine
* **Goal**: Build the food catalog browse interface and cart engine, supporting Dine-in options and delivery checking.
* **Backend Tasks**:
  * Implement `catalog` app schemas: `Category` and `MenuItem`.
  * Seed initial database with Menu Items (Tea, Coffee, Maggie, Burger, Pasta).
  * Develop catalog retrieval endpoints: `GET /api/menu/` with filters.
  * Create `orders` app models (`Order`, `OrderItem`).
  * Implement `DistanceCalculatorService` (using the Haversine formula) to validate distance limit requests ($< 5.0$ KM).
  * Build order validation and checkout endpoints: `POST /api/orders/`.
* **Frontend Tasks**:
  * Build Catalog page displaying categorized items, tags (Best Sellers, Prep-time, Vegetarian indicators).
  * Build Cart Sidebar with local state persistence.
  * Build Checkout page with address inputs (using Google Map Address Autocomplete or geo-inputs).
  * Integrate distance check warnings if the selected address is close to the 5 KM border.
* **Deliverables**:
  * Interactive digital menu catalog.
  * Working local/session cart persistence.
  * Complete order submission and delivery validation endpoint.
* **Dependencies**: Sprint 1 Auth Pipeline complete.

---

### Sprint 3: Safe Mini-Theater & Event Reservation Engine
* **Goal**: Develop the slot booking engine for the private theater, implementing transactional isolation locks to prevent double-booking.
* **Backend Tasks**:
  * Implement `bookings` app schemas: `TheaterSlot`, `TheaterBooking`, `EventPackage`, and `EventBooking`.
  * Develop `TheaterBookingService` with transactional boundaries and database row-level locking (`select_for_update()`).
  * Build slots lookup endpoints: `GET /api/theater/slots/?date=YYYY-MM-DD`.
  * Build reservation check-out API: `POST /api/theater/bookings/` ensuring validation for headcount (max 8) and buffer timing.
  * Build Event reservation endpoints for birthday and farewell parties.
* **Frontend Tasks**:
  * Build Interactive Theater Calendar allowing date and slot selection (5 PM - 8 PM vs 8 PM - 11 PM).
  * Build booking forms for guest count details, screening types, and optional food package selections.
  * Implement Event Packages description layouts detailing Basic vs. Premium Birthday offerings.
  * Integrate summary screen presenting reservation details and rules warning check.
* **Deliverables**:
  * Thread-safe, double-booking proof theater slots API.
  * Client UI for reservation scheduling, slot availability monitoring, and package inclusions details.
* **Dependencies**: Sprint 1 Auth and Database structures.

---

### Sprint 4: Marketing Campaigns, Offers, & Review Pipeline
* **Goal**: Launch marketing coupon controls, student identification verification workflow, and user review features.
* **Backend Tasks**:
  * Build `marketing` app models: `Offer` coupon schemes.
  * Develop validation logic applying discount values (percentage/flat deductions), verifying validity timeframes and exclusion guidelines.
  * Implement student document review models and verification submission APIs.
  * Create `reviews` app models for item and booking reviews.
  * Add backend filters restricting review submissions to users who have ordered or booked the corresponding items.
* **Frontend Tasks**:
  * Integrate discount code application bar in Checkout pages.
  * Build Profile dashboard section allowing student ID uploads (PDF/Images) and display of verification status badges.
  * Integrate interactive Star Rating system on Menu Item detail drawers and Booking summaries.
* **Deliverables**:
  * Coupon code generation tools and calculations engine.
  * Verified Purchase review collection API.
  * User profile management dashboards with ID verification interface.
  * Verification email templates.
* **Dependencies**: Sprint 2 Catalog & Ordering Engine.

---

### Sprint 5: Admin Command Center & Real-Time Kitchen Display
* **Goal**: Deliver the operations portal for cafe staff, including menu editors, booking calendars, and analytical dashboards.
* **Backend Tasks**:
  * Configure Cloudinary storage handlers for media asset storage uploads.
  * Build administrative APIs to handle menu edits (`POST`, `PUT`, `DELETE` catalog items) and booking controls (manually blocking slots).
  * Build analytical query endpoints aggregating today's stats, active orders count, slot occupancy rates, and sales trends.
  * Configure Django channels or Server-Sent Events (SSE) for live order update notifications to kitchen dashboards.
* **Frontend Tasks**:
  * Design Admin Dashboard Layout (Premium dark console, charts).
  * Build Kitchen Kanban order tracking screen updates.
  * Build Slot Administration Portal (interactive scheduling grid showing booked names and quick-block controls).
  * Integrate data visualizations (charts for sales, slot occupancy metrics, and popular menu items).
* **Deliverables**:
  * Real-time kitchen dashboard console.
  * CRUD interface for menu editing, slot scheduling overrides, and reviews approval list.
  * Automated dashboard reports.
  * Direct Media Upload integrations with Cloudinary transformation controls.
* **Dependencies**: Sprint 3 Booking Engine & Sprint 4 Marketing rules.

---

### Sprint 6: Optimization, Deployment, and Launch Prep
* **Goal**: Establish the production environment, execute integration test suites, optimize performance, and deploy to target servers.
* **Backend Tasks**:
  * Enable HTTPS redirect security middleware, secure production cookies, and secure CORS headers configurations.
  * Setup Nginx reverse-proxy and Gunicorn processes parameters.
  * Scaffolding multi-stage Docker environment (`Dockerfile.prod` and `docker-compose.prod.yml`).
  * Run database indexes optimization and verify query speeds.
  * Build integration testing suites testing concurrency bookings scenarios and geolocation accuracy bounds.
* **Frontend Tasks**:
  * Implement Next.js production builds.
  * Configure SEO tags: meta descriptions, canonical URLs, and structured JSON-LD data for the Indore local search optimization.
  * Optimize image delivery dimensions, layout components and animation bundle footprints.
* **Deliverables**:
  * Production Docker infrastructure.
  * Nginx and SSL configurations.
  * CI/CD script workflows.
  * 100% green integration verification builds.
* **Dependencies**: All preceding sprints completed.

---

## 3. Production Deployment Architecture Model

During Sprint 6, the system wraps in a secure production infrastructure modeled as follows:

```
                            [ Client Request ]
                                    │
                                    ▼ (HTTPS - Port 443)
                            [ Nginx Reverse Proxy ]
                            (SSL / Rate Limiter)
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼ (Static Assets / Server-Side Render)              ▼ (API Proxies / `/api/v1/`)
    [ Next.js Node SSR ]                              [ Django Gunicorn Container ]
          │                                                   │
          ▼                                                   ├───────────────┐
  [ Cloudinary CDN ]                                          ▼               ▼
(Media Assets / Images)                               [ PostgreSQL DB ]  [ Redis Cache ]
                                                      (Data Store)     (SSE/Rate limit)
```

---

## 4. Key Engineering Milestones & Quality Gates

* **Gate 1 (End of Wk 2)**: Core Registration, Token rotations, and Session validations successfully pass test constraints.
* **Gate 2 (End of Wk 4)**: Cart calculations successfully filter spatial distances $>5$ KM and block checkout procedures with appropriate error codes.
* **Gate 3 (End of Wk 6)**: Simulated race conditions run 50 concurrent booking attempts for the same slot. Validation criteria verify exactly 1 reservation resolves, while remaining 49 receive 409 conflict errors.
* **Gate 4 (End of Wk 10)**: Admin dashboard load speeds under $300\text{ms}$ with full analytics queries cache hits.
