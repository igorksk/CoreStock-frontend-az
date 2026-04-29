# CoreStock UI — Frontend

React 18 + TypeScript + Vite dashboard for inventory and financial accounting of PC hardware components.

## Run locally

```bash
npm install
npm run dev
```

App: **http://localhost:5173**

Requires the [CoreStock API](../backend) running on `http://localhost:5116`.

## Pages

| Page | Description |
|------|-------------|
| Dashboard | KPI cards, monthly revenue/profit chart, 30-day trend, top products |
| Products | Sortable table, search/filter, low-stock alerts, create/edit/delete |
| Purchases | Purchase orders, line items, receive stock, cancel |
| Orders | Sales orders, Ship → Deliver workflow, profit per line |
| Reports | Inventory levels, revenue vs expenses, profit trend, top 20 products |

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base API URL. Defaults to `http://localhost:5116/api` |

Create `.env.production` (ignored by git) with:
```
VITE_API_URL=https://<your-app-service>.azurewebsites.net/api
```

## Tech stack

| | |
|-|-|
| Build | Vite 6 |
| UI | React 18 + TypeScript |
| Routing | React Router v6 |
| Charts | Chart.js + react-chartjs-2 |
| HTTP | Axios |
| Forms | React Hook Form |
| Icons | Lucide React |

## Deploy to Azure Static Web Apps

```bash
npm run build

az staticwebapp deploy \
  --name <STATIC_WEB_APP_NAME> \
  --resource-group <RESOURCE_GROUP> \
  --source ./dist \
  --env production
```

GitHub Actions workflow: [`.github/workflows/frontend.yml`](../.github/workflows/frontend.yml)

Required secrets: `AZURE_STATIC_WEB_APPS_API_TOKEN`, `VITE_API_URL`
