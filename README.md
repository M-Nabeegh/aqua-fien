# Water Supply Ledger (Frontend MVP)

Next.js (App Router) + Tailwind UI with simple pages:
- Dashboard
- Customers (from your schema)
- Employees (from your schema)
- Advances (employee salary advances)

Mock API routes under `/app/api/*` return demo data.
Replace them with real backend endpoints when ready.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Notes
- This is a frontend-only MVP scaffold.
- To connect to your Node+Postgres backend:
  - Replace fetch calls in pages with your backend URL (e.g., `http://localhost:3000/customers`).
  - Or create API route proxies that call your backend server.
