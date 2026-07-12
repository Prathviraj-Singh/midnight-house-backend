# Midnight House: Engineering Task Breakdown

This document provides a highly granular, step-by-step engineering task breakdown for implementing the **Midnight House** web platform. It acts as the direct backlog for developers, breaking the scope into 12 logical system components spanning the 6-sprint roadmap.

---

## Task Breakdown Matrix

### 1. Project Foundation
Establish the core environments, configurations, and repository baselines for both frontend and backend domains.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-1.1** | Repository Initialization, Directory Structuring, and `.gitignore` setup | High | None | Low (1 pt) | Sprint 1 |
| **TSK-1.2** | PostgreSQL Local Database seeding, admin role creation, and permission configuration | High | TSK-1.1 | Low (2 pts) | Sprint 1 |
| **TSK-1.3** | Django Config Refactoring into environments structure (`base.py`, `local.py`, `production.py`) | High | TSK-1.2 | Low (2 pts) | Sprint 1 |
| **TSK-1.4** | Next.js Workspace Scaffold (TypeScript, App Router, `/src` structure, ESLint, alias `@/*`) | High | TSK-1.1 | Low (2 pts) | Sprint 1 |
| **TSK-1.5** | Shadcn UI Integration, accent themes (Midnight Charcoal `#121212` / Gold `#D4AF37`) & styling setup | High | TSK-1.4 | Low (2 pts) | Sprint 1 |

---

### 2. Authentication
Implement secure password hashing, token storage, and dual-token rotation using HTTP-only cookies.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-2.1** | Custom `User` model implementation using Email as identifier and password security configurations | High | TSK-1.3 | Medium (3 pts) | Sprint 1 |
| **TSK-2.2** | SimpleJWT integration, token lifespan (15m/7d), blacklisting parameters, and token rotation rules | High | TSK-2.1 | Medium (3 pts) | Sprint 1 |
| **TSK-2.3** | Custom Django HTTP-only secure cookie authenticator middleware | High | TSK-2.2 | Medium (5 pts) | Sprint 1 |
| **TSK-2.4** | Auth Endpoints implementation: `RegisterView`, `LoginView`, `LogoutView`, and `TokenRefreshView` | High | TSK-2.3 | Medium (5 pts) | Sprint 1 |
| **TSK-2.5** | Axios Client Handler in Next.js (`src/lib/api.ts`) configured with `withCredentials: true` | High | TSK-1.4, TSK-2.4 | Low (2 pts) | Sprint 1 |
| **TSK-2.6** | Frontend Login & Registration UI screens designed using Tailwind, Shadcn forms, and client validations | High | TSK-1.5, TSK-2.5 | Medium (3 pts) | Sprint 1 |

---

### 3. User Profiles
Manage user details, addresses, and the student verification system.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-3.1** | `UserProfile` model mapping: OneToOneUser relation, default delivery address, and metadata | High | TSK-2.1 | Low (2 pts) | Sprint 1 |
| **TSK-3.2** | Profile API endpoint implementation (retrieval and address updating with `IsOwnerOrAdmin` scope) | Medium | TSK-3.1 | Low (2 pts) | Sprint 1 |
| **TSK-3.3** | Student ID Verification Upload API supporting multi-part PDF/Image documents | Medium | TSK-3.1, TSK-10.1 | Medium (3 pts) | Sprint 4 |
| **TSK-3.4** | Student Verification Admin Queues API (Admin approval, rejection, and flag toggling controls) | Medium | TSK-3.3 | Medium (3 pts) | Sprint 4 |
| **TSK-3.5** | Frontend User Dashboard UI (displays saved addresses, order history grid, and active booking lists) | High | TSK-2.6 | Medium (5 pts) | Sprint 1 |
| **TSK-3.6** | Frontend Student Verification portal (upload drawer, review statuses, and verified badges) | Medium | TSK-3.3, TSK-3.5 | Medium (3 pts) | Sprint 4 |

---

### 4. Menu & Catalog
Expose dynamic catalog classifications and item structures to patrons.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-4.1** | `Category` & `MenuItem` models and PostgreSQL schemas initialization | High | TSK-1.3 | Low (2 pts) | Sprint 2 |
| **TSK-4.2** | Database Seeding Scripts (seeding Tea, Coffee, Maggie, Burger, Pasta) and item descriptions | Medium | TSK-4.1 | Low (1 pt) | Sprint 2 |
| **TSK-4.3** | Menu Catalog retrieval API view (`GET /api/v1/catalog/items/` grouped by categories with availability flags) | High | TSK-4.1 | Low (2 pts) | Sprint 2 |
| **TSK-4.4** | Catalog Administration Endpoint (CRUD views for Menu items, image upload, and real-time inventory toggle) | High | TSK-4.3, TSK-10.1 | Medium (5 pts) | Sprint 5 |
| **TSK-4.5** | Frontend Catalog page (Responsive menu, category filters, Vegetarian indicator, and details drawers) | High | TSK-1.5, TSK-4.3 | Medium (5 pts) | Sprint 2 |

---

### 5. Orders
Manage shopping carts, delivery radius constraints, order placement, and preparation state tracking.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-5.1** | `Order` & `OrderItem` models, status choices, and multi-table relationships creation | High | TSK-2.1, TSK-4.1 | Medium (3 pts) | Sprint 2 |
| **TSK-5.2** | Distance Calculator Service using the Haversine formula mappingइंदौर coordinates with a strict 5 KM limit | High | TSK-5.1 | Medium (5 pts) | Sprint 2 |
| **TSK-5.3** | Order Checkout view API (`POST /api/v1/orders/checkout/` with transaction handling, stock checks, and fee overrides) | High | TSK-5.2 | High (8 pts) | Sprint 2 |
| **TSK-5.4** | Frontend Shopping Cart Management Context (handling local state, additions, and quantities) | High | TSK-4.5 | Medium (3 pts) | Sprint 2 |
| **TSK-5.5** | Frontend Checkout Page (Address forms, Dine-in vs Delivery selections, and 4.7 KM warning limits) | High | TSK-5.4, TSK-5.3 | Medium (5 pts) | Sprint 2 |
| **TSK-5.6** | Real-time order state push framework setup (Django Channels or Server-Sent Events backend listeners) | Medium | TSK-5.3 | High (8 pts) | Sprint 5 |

---

### 6. Theater Booking
Build slot validations and thread-safe reservation capabilities for the private mini-theater.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-6.1** | `TheaterSlot` and `TheaterBooking` models implementation (fixed 5-8 PM Slot A and 8-11 PM Slot B) | High | TSK-2.1 | Medium (3 pts) | Sprint 3 |
| **TSK-6.2** | Backend Concurrency Service (`SELECT ... FOR UPDATE` locks within `transaction.atomic()` transaction boundaries) | High | TSK-6.1 | High (8 pts) | Sprint 3 |
| **TSK-6.3** | Slot Status retrieval endpoint (`GET /api/v1/theater/slots/?date=YYYY-MM-DD` mapping availability states) | High | TSK-6.1 | Medium (3 pts) | Sprint 3 |
| **TSK-6.4** | Reservation checkout API (`POST /api/v1/theater/bookings/` checking capacity < 8 and 2-hour advance policies) | High | TSK-6.2 | High (5 pts) | Sprint 3 |
| **TSK-6.5** | Frontend interactive Booking Calendar page (slot selections, screening forms, and upsell modules) | High | TSK-1.5, TSK-6.3, TSK-6.4 | High (8 pts) | Sprint 3 |

---

### 7. Event Booking
Manage customizable packages and larger birthday or party celebrations.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-7.1** | `EventPackage` (Basic/Premium/Farewell) and `EventBooking` models and migrations | Medium | TSK-2.1 | Low (2 pts) | Sprint 3 |
| **7.2** | Event Booking API (`POST /api/v1/events/bookings/` validating fixed descriptions and a max limit of 10 guests) | Medium | TSK-7.1 | Medium (3 pts) | Sprint 3 |
| **7.3** | Frontend Event Packages grid (displaying lists of features included in Basic vs Premium formats) | Medium | TSK-7.1 | Low (3 pts) | Sprint 3 |
| **7.4** | Frontend Event Booking panel (form selections, customized inputs, and date queries) | Medium | TSK-7.2, TSK-7.3 | Medium (3 pts) | Sprint 3 |

---

### 8. Offers & Discounts
Incorporate coupon codes, weekend policies, and verification-restricted student rates.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-8.1** | `Offer` model schema (Percentage, Flat, or Free items with validation limits) | Medium | TSK-1.3 | Low (2 pts) | Sprint 4 |
| **TSK-8.2** | Server-Side Promotion Evaluator logic (validating expiries, student clearances, and non-stacking limits) | Medium | TSK-8.1, TSK-5.3 | High (5 pts) | Sprint 4 |
| **TSK-8.3** | Coupon Verification endpoint (`POST /api/v1/offers/validate/` checking code validity against active sessions) | Medium | TSK-8.2 | Low (2 pts) | Sprint 4 |
| **TSK-8.4** | Frontend Promo Code inputs and dynamic discount calculations on checkout lists | Medium | TSK-8.3, TSK-5.5 | Low (3 pts) | Sprint 4 |

---

### 9. Reviews
Provide social proof through verified customer ratings.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-9.1** | `Review` model mapped to user, menu items, and bookings with rating caps (1-5 stars) | Low | TSK-2.1 | Low (1 pt) | Sprint 4 |
| **TSK-9.2** | Review validation API (`POST /api/v1/reviews/` asserting that the user has ordered the specific menu item or slot) | Low | TSK-9.1, TSK-5.1, TSK-6.1 | Medium (3 pts) | Sprint 4 |
| **TSK-9.3** | Admin Review Moderation endpoints (toggling `is_approved` status and submitting answers) | Low | TSK-9.2 | Low (2 pts) | Sprint 5 |
| **TSK-9.4** | Frontend Review Form and Star rating panel integrated within order details page | Low | TSK-9.2 | Medium (3 pts) | Sprint 4 |

---

### 10. Admin Dashboard
Build tools for physical store operators and administrative coordinators.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-10.1** | Cloudinary SDK integration configuration (file upload wrappers on base systems) | High | TSK-1.3 | Medium (3 pts) | Sprint 5 |
| **TSK-10.2** | Live Kitchen Kanban Console UI (interactive boards mapping order stages with push alerts) | High | TSK-5.6 | High (8 pts) | Sprint 5 |
| **TSK-10.3** | Admin Slot Scheduler interface (visual calendar grids displaying booked names and manual block controls) | High | TSK-6.3, TSK-6.5 | Medium (5 pts) | Sprint 5 |
| **TSK-10.4** | Admin Campaign & Catalog manager UI (forms to change items, create promotions, and review reviews) | Medium | TSK-4.4, TSK-8.4, TSK-9.3 | Medium (5 pts) | Sprint 5 |

---

### 11. Analytics
Enable data-driven decisions via interactive analytical summaries.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-11.1** | Analytical calculations API (`GET /api/v1/admin/analytics/` with cached results for gross, busy slots, and cohorts) | Low | TSK-5.1, TSK-6.1 | High (5 pts) | Sprint 5 |
| **TSK-11.2** | Visual Charts implementation on Admin panels using chart libraries (Recharts / Chart.js) | Low | TSK-11.1 | Medium (5 pts) | Sprint 5 |

---

### 12. Deployment
Configure production containers, reverse proxy rules, SSL certificates, search indexes, and concurrent verification simulations.

| Task ID | Task Description | Priority | Dependencies | Estimated Complexity | Sprint Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-12.1** | Production Multi-Stage Dockerfile and Orchestration (`docker-compose.prod.yml`) | High | TSK-1.3, TSK-1.4 | Medium (3 pts) | Sprint 6 |
| **TSK-12.2** | Nginx Reverse Proxy routing, static files serving, and SSL certificate integrations | High | TSK-12.1 | Medium (3 pts) | Sprint 6 |
| **TSK-12.3** | Production Cors settings, security configurations (`SECURE_COOKIE` rules), and environment audits | High | TSK-12.2 | Medium (3 pts) | Sprint 6 |
| **TSK-12.4** | Local SEO configurations (JSON-LD structured data and meta descriptions targeted to Vijay Nagar, Indore) | Medium | TSK-1.4 | Low (2 pts) | Sprint 6 |
| **TSK-12.5** | Concurrency Integration testing suite (simulating booking races and geolocation threshold checks) | High | TSK-6.2, TSK-5.2 | High (8 pts) | Sprint 6 |

---

## Suggested Strategy & Quality Control Guidelines

1. **Sprint Boundaries Enforcement**: Sprints are strict 2-week boxes. Maintain sprint boundaries. Ensure dependencies are satisfied before proceeding.
2. **Quality Gates**:
    * **Sprint 1 Gate**: Auth token rotations pass cookies correctly; unprotected paths yield `401`.
    * **Sprint 2 Gate**: Distance checks reliably reject coordinates outside Indore 5 KM bounds with high precision.
    * **Sprint 3 Gate**: Load simulations running multiple concurrent bookings for the exact same slot result in exactly one confirmation and the remaining yielding 409 conflict errors.
    * **Sprint 4 Gate**: Stacking discount checks verify coupons cannot be combined.
    * **Sprint 5 Gate**: Real-time kitchen dashboard reflects status changes under 200ms using WebSockets or SSE.
