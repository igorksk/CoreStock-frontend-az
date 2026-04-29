import { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { reportsApi } from '../api';
import type { DashboardData } from '../types';
import { KpiCard } from '../components/ui/KpiCard';
import { Spinner } from '../components/ui/Spinner';
import { fmt } from '../utils/format';
import { TrendingUp, TrendingDown } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#7b80a0', boxWidth: 12, padding: 16 } } },
  scales: {
    x: { grid: { color: 'rgba(46,49,71,.5)' }, ticks: { color: '#7b80a0' } },
    y: { grid: { color: 'rgba(46,49,71,.5)' }, ticks: { color: '#7b80a0', callback: (v: number | string) => `$${Number(v).toLocaleString()}` } },
  },
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <><div className="topbar">Dashboard</div><Spinner /></>;
  if (!data) return <><div className="topbar">Dashboard</div><div className="page"><p>Failed to load data.</p></div></>;

  const { thisMonth, lastMonth, ytd, monthly, topProducts, inventory, daily } = data;

  const revGrowth = lastMonth.totalRevenue > 0
    ? ((thisMonth.totalRevenue - lastMonth.totalRevenue) / lastMonth.totalRevenue * 100).toFixed(1)
    : null;

  // Monthly revenue/profit bar chart
  const monthLabels = monthly.map(m => m.monthName.split(' ')[0]);
  const monthlyBar = {
    labels: monthLabels,
    datasets: [
      { label: 'Revenue', data: monthly.map(m => m.revenue), backgroundColor: 'rgba(99,102,241,.7)', borderRadius: 4 },
      { label: 'Profit',  data: monthly.map(m => m.profit),  backgroundColor: 'rgba(34,197,94,.6)',  borderRadius: 4 },
    ],
  };

  // Daily revenue line chart (last 30 days)
  const dailyLine = {
    labels: daily.map(d => fmt.date(d.date).split(',')[0]),
    datasets: [
      {
        label: 'Revenue', data: daily.map(d => d.revenue),
        borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.1)',
        fill: true, tension: 0.4, pointRadius: 2,
      },
      {
        label: 'Profit', data: daily.map(d => d.profit),
        borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,.05)',
        fill: false, tension: 0.4, pointRadius: 2,
      },
    ],
  };

  // Top products doughnut
  const donut = {
    labels: topProducts.map(p => p.productName.split(' ').slice(0, 3).join(' ')),
    datasets: [{
      data: topProducts.map(p => p.totalRevenue),
      backgroundColor: ['#6366f1','#22c55e','#38bdf8','#f59e0b','#ef4444'],
      borderWidth: 0,
    }],
  };

  return (
    <>
      <div className="topbar">
        <span>Dashboard</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>YTD: {fmt.currency(ytd.totalRevenue)} revenue</span>
      </div>
      <div className="page">

        {/* KPIs */}
        <div className="kpi-grid">
          <KpiCard
            label="Revenue (This Month)"
            value={fmt.currency(thisMonth.totalRevenue)}
            sub={revGrowth !== null
              ? `${Number(revGrowth) >= 0 ? 'в–І' : 'в–ј'} ${Math.abs(Number(revGrowth))}% vs last month`
              : 'vs last month'}
            accent={Number(revGrowth) >= 0 ? 'green' : 'red'}
          />
          <KpiCard
            label="Gross Profit (This Month)"
            value={fmt.currency(thisMonth.grossProfit)}
            sub={`Margin: ${fmt.pct(thisMonth.grossMarginPct)}`}
            accent="green"
          />
          <KpiCard
            label="Orders (This Month)"
            value={fmt.number(thisMonth.totalOrders)}
            sub={`${fmt.currency(thisMonth.totalRevenue / Math.max(thisMonth.totalOrders, 1))} avg`}
          />
          <KpiCard
            label="Inventory Value"
            value={fmt.currency(inventory.totalInventoryValue)}
            sub={`${inventory.totalProducts} products`}
          />
          <KpiCard
            label="Low Stock Alerts"
            value={String(inventory.lowStockCount)}
            sub={`${inventory.outOfStockCount} out of stock`}
            accent={inventory.lowStockCount > 0 ? 'yellow' : 'green'}
          />
          <KpiCard
            label="YTD Revenue"
            value={fmt.currency(ytd.totalRevenue)}
            sub={`Profit: ${fmt.currency(ytd.grossProfit)}`}
            accent="blue"
          />
        </div>

        {/* Charts row 1 */}
        <div className="charts-row">
          <div className="card">
            <div className="card-title">Monthly Revenue &amp; Profit</div>
            <div className="chart-wrap">
              <Bar data={monthlyBar} options={CHART_OPTS as any} />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Daily Trend вЂ” Last 30 Days</div>
            <div className="chart-wrap">
              <Line data={dailyLine} options={CHART_OPTS as any} />
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="charts-row">
          <div className="card">
            <div className="card-title">Top 5 Products by Revenue</div>
            <div className="chart-wrap" style={{ height: 240 }}>
              <Doughnut data={donut} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#7b80a0', boxWidth: 12, padding: 12 } } },
              }} />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Top Selling Products</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Product</th><th>Qty Sold</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={p.productId}>
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.productName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.categoryName}</div>
                      </td>
                      <td>{fmt.number(p.totalQuantitySold)}</td>
                      <td className="text-right">{fmt.currency(p.totalRevenue)}</td>
                      <td className="text-right text-success">{fmt.currency(p.totalProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
