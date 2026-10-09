# Murshid — Modern Fashion E-commerce

A complete, production-quality clothing e-commerce website built with **React + Django + SQLite3**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Axios |
| Backend | Python 3.10, Django 5, Django REST Framework |
| Database | SQLite3 |
| Auth | JWT (djangorestframework-simplejwt) |
| PDF Invoices | ReportLab |
| Styling | CSS Modules + custom design system |

---

## Project Structure

```
murshid/
├── backend/                  # Django project
│   ├── config/               # Django settings, URLs
│   ├── products/             # Product & Category models/APIs
│   ├── orders/               # Order management & invoice APIs
│   ├── customers/            # Customer management APIs
│   ├── accounts/             # JWT admin authentication
│   ├── core/                 # Business settings API
│   ├── utils/                # Invoice PDF generator, email utils
│   ├── media/                # Uploaded images & generated invoices
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                  # Environment variables (never commit)
│   └── .env.example          # Template for .env
│
├── frontend/                 # React app (Vite)
│   ├── src/
│   │   ├── components/       # Navbar, Footer, ProductCard, etc.
│   │   ├── pages/            # Customer pages
│   │   ├── pages/admin/      # Admin dashboard pages
│   │   ├── layouts/          # CustomerLayout, AdminLayout
│   │   ├── context/          # CartContext, AuthContext
│   │   ├── services/         # Axios API service layer
│   │   └── index.css         # Global design tokens & utilities
│   ├── public/               # Static assets (logo.jpeg)
│   ├── package.json
│   └── vite.config.js        # Dev proxy → backend :8001
│
├── logo.jpeg                 # Brand logo (source)
├── t-shirt1.jpeg … t-shirt9.jpeg   # Product images (source)
└── README.md
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+ & npm 9+
- Git (optional)

---

## Backend Setup

### 1. Create & activate virtual environment

```bash
# Windows
cd murshid/backend
py -3.10 -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
# Copy the example file
copy .env.example .env        # Windows
cp .env.example .env          # macOS/Linux
```

Edit `.env` with your values:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

DEFAULT_FROM_EMAIL=Murshid Store <your@gmail.com>
BUSINESS_EMAIL=admin@murshid.com

ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173
```

> **Gmail tip**: Use an App Password (Google Account → Security → 2-Step Verification → App passwords).

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Create admin superuser

```bash
python manage.py createsuperuser
```

Or use the pre-created default:
- **Username:** `admin`
- **Password:** `admin123`

### 6. Seed sample products & categories

```bash
python manage.py shell -c "exec(open('seed_data.py').read())"
```

This copies the existing `logo.jpeg` and `t-shirt1–9.jpeg` images into `media/` and creates 9 sample products across Men/Women categories.

### 7. Start the backend server

```bash
python manage.py runserver 8001
```

Backend runs at: **http://127.0.0.1:8001**

---

## Frontend Setup

### 1. Install dependencies

```bash
cd murshid/frontend
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Frontend runs at: **http://localhost:5173**

The Vite dev server automatically proxies `/api` and `/media` requests to `http://127.0.0.1:8001`.

---

## Running Both Together

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd murshid/backend
venv\Scripts\activate
python manage.py runserver 8001
```

**Terminal 2 — Frontend:**
```bash
cd murshid/frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Key URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Customer website |
| http://localhost:5173/shop | Product listing |
| http://localhost:5173/admin/login | Admin dashboard login |
| http://localhost:5173/admin/dashboard | Admin dashboard |
| http://127.0.0.1:8001/api/products/ | Products API |
| http://127.0.0.1:8001/api/orders/ | Orders API |
| http://127.0.0.1:8001/django-admin/ | Django built-in admin |

---

## Admin Credentials (default)

```
Username: admin
Password: admin123
```

Change these in production via `python manage.py changepassword admin`.

---

## WhatsApp Configuration

1. Log in to the admin dashboard → **Settings**
2. Enter your WhatsApp number in the field (include country code, no `+` or spaces)
   - Example for India: `919876543210`
3. Save settings

All WhatsApp order links across the website will use this number automatically.

**How it works:** When a customer places an order, the browser opens a `https://wa.me/NUMBER?text=...` link with a pre-filled order message. The customer presses Send. No WhatsApp API or Business API required.

---

## Email Configuration

Set these in `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Murshid Store <your@gmail.com>
BUSINESS_EMAIL=admin@murshid.com
```

After every order:
- **Customer** receives an order confirmation email with invoice PDF attached (if email was provided).
- **Admin** (`BUSINESS_EMAIL`) receives a new order notification.

To test without sending real emails, change the backend in `settings.py`:
```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

---

## Invoice PDFs

Invoices are auto-generated using ReportLab when an order is placed.

- Stored at: `backend/media/invoices/INV-YYYYMMDD-XXXX.pdf`
- Download via: `GET /api/orders/{ORDER_NUMBER}/invoice/`
- Includes: business logo, order details, itemised table, totals, payment status

---

## Media Files (Images)

| Directory | Contents |
|-----------|----------|
| `backend/media/products/thumbnails/` | Product thumbnail images |
| `backend/media/products/images/` | Product gallery images |
| `backend/media/settings/` | Business logo |
| `backend/media/invoices/` | Generated PDF invoices |

In production, point `MEDIA_ROOT` to a persistent storage location and serve via nginx or move to S3/Cloudinary (the code is structured to make this easy — just update `DEFAULT_FILE_STORAGE` in `settings.py`).

---

## Building for Production

**Frontend:**
```bash
cd murshid/frontend
npm run build
# Output in frontend/dist/
```

**Backend:**
```bash
# Set DEBUG=False in .env
# Run collectstatic
python manage.py collectstatic
# Serve with gunicorn + nginx
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8001
```

---

## Features Summary

### Customer Website
- Home page with hero slider, categories, new arrivals, trending, best sellers, reviews
- Shop page with search, category filter, sort
- Product detail with image gallery, size/color selector, zoom, WhatsApp order button
- Cart (localStorage-persisted, survives page refresh)
- Checkout with full validation
- Order confirmation with invoice download + WhatsApp pre-filled message
- Floating WhatsApp button, back-to-top button
- Fully responsive (mobile-first design)

### Admin Dashboard
- JWT-protected login
- Dashboard with stats (total orders, products, customers, revenue)
- Product CRUD — add/edit/delete with image upload, size/color management, collection tags
- Category CRUD with parent/child support
- Orders — list with status tabs, full detail view, status update, invoice download, send email, WhatsApp customer
- Customers — list, detail with full order history
- Settings — business info, logo upload, WhatsApp number

---

## Common Commands

```bash
# Reset database (WARNING: deletes all data)
del backend\db.sqlite3
python manage.py migrate
python manage.py createsuperuser
python manage.py shell -c "exec(open('seed_data.py').read())"

# Create new Django app
python manage.py startapp myapp

# Check for issues
python manage.py check

# Make & apply migrations after model changes
python manage.py makemigrations
python manage.py migrate
```

---

## Troubleshooting

**Backend won't start:**
- Make sure venv is activated
- Check `.env` exists with `SECRET_KEY` set
- Run `python manage.py check`

**Images not loading:**
- Ensure `MEDIA_URL = '/media/'` in `settings.py`
- Check that `static(MEDIA_URL, ...)` is in `config/urls.py`
- Vite proxy handles `/media` in development automatically

**CORS errors:**
- Confirm `CORS_ALLOWED_ORIGINS` in `settings.py` includes `http://localhost:5173`

**Emails not sending:**
- Check Gmail App Password (not your regular password)
- Try `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'` to print emails to terminal instead

**npm install fails:**
- Try `npm install --legacy-peer-deps`
- Ensure Node.js 18+ is installed

---

*Built with React + Django + SQLite3 · Murshid Fashion Store*
#   m u r s h i d  
 #   m u r s h i d  
 