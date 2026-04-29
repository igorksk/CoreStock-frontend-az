import { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { reportsApi } from '../api';
import type { InventoryReport, TopProduct, MonthlySummary } from '../types';
import { Spinner } from '../components/ui/Spinner';
import { StockBadge } from '../components/ui/Badge';
import { KpiCard } from '../components/ui/KpiCard';
import { fmt } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

type Tab = 'inventory' | 'sales' | 'profit' | 'topproducts';

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#7b80a0', boxWidth: 12 } } },
  scales: {
    x: { grid: { color: 'rgba(46,49,71,.5)' }, ticks: { color: '#7b80a0' } },
    y: { grid: { color: 'rgba(46,49,71,.5)' }, ticks: { color: '#7b80a0' } },
  },
};

export default function Reports() {
  const [tab, setTab] = useState<Tab>('inventory');
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [invSearch, setInvSearch] = useState('');

  useEffect(() => {
    Promise.all([
      reportsApi.getInventory(),
      reportsApi.getTopProducts(undefined, undefined, 20),
      reportsApi.getMonthly(),
    ]).then(([inv, top, mon]) => {
      setInventory(inv); setTopProducts(top); setMonthly(mon);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <><div className="topbar">Reports</div><Spinner /></>;

  const inv = inventory!;

  const monthlyRevBar = {
    labels: monthly.map(m => m.monthName.split(' ')[0]),
    datasets: [
      { label: 'Revenue', data: monthly.map(m => m.revenue), backgroundColor: 'rgba(99,102,241,.7)', borderRadius: 4 },
      { label: 'Purchases', data: monthly.map(m => m.purchaseExpenses), backgroundColor: 'rgba(245,158,11,.6)', borderRadius: 4 },
    ],
  };

  const profitLine = {
    labels: monthly.map(m => m.monthName.split(' ')[0]),
    datasets: [{
      label: 'Gross Profit',
      data: monthly.map(m => m.profit),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,.1)',
      fill: true, tension: 0.4, pointRadius: 3,
    }],
  };

  const filteredInv = inv.items.filter(i =>
    !invSearch || i.productName.toLowerCase().includes(invSearch.toLowerCase()) ||
    i.sku.toLowerCase().includes(invSearch.toLowerCase())
  );

  return (
    <>
      <div className="topbar">Reports &amp; Analytics</div>
      <div className="page">
        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {(['inventory', 'sales', 'profit', 'topproducts'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`btn btn-ghost btn-sm`} style={{
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: '4px 4px 0 0',
              color: tab === t ? 'var(--primary-h)' : undefined,
            }}>
              {t === 'inventory' ? 'Inventory' : t === 'sales' ? 'Sales' : t === 'profit' ? 'Profit Trend' : 'Top Products'}
            </button>
          ))}
        </div>

        {/* в”Ђв”Ђ Inventory Tab в”Ђв”Ђ */}
        {tab === 'inventory' && (
          <>
            <div className="kpi-grid mb-6">
              <KpiCard label="Total Inventory Value" value={fmt.currency(inv.totalInventoryValue)} sub={`${inv.totalProducts} active products`} />
              <KpiCard label="Low Stock" value={String(inv.lowStockCount)} sub="at or below minimum" accent="yellow" />
              <KpiCard label="Out of Stock" value={String(inv.outOfStockCount)} accent={inv.outOfStockCount > 0 ? 'red' : 'green'} />
            </div>
            <div className="card">
              <div className="toolbar mb-4">
                <span className="section-title">Stock Levels</span>
                <input className="search-input" placeholder="Search product or SKUвЂ¦" value={invSearch} onChange={e => setInvSearch(e.target.value)} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th><th>Category</th><th>Brand</th>
                      <th className="text-right">Stock</th>
                      <th className="text-right">Min Level</th>
                      <th className="text-right">Avg Cost</th>
                      <th className="text-right">Sell Price</th>
                      <th className="text-right">Inv. Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInv.map(item => (
                      <tr key={item.productId} className={item.stockStatus === 'Out of Stock' ? 'row-out-of-stock' : item.stockStatus === 'Low Stock' ? 'row-low-stock' : ''}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{item.productName}</div>
                          <div className="mono text-muted" style={{ fontSize: 11 }}>{item.sku}</div>
                        </td>
                        <td>{item.categoryName}</td>
                        <td>{item.brandName}</td>
                        <td className="text-right">{item.stockQuantity}</td>
                        <td className="text-right text-muted">{item.minStockLevel}</td>
                        <td className="text-right">{fmt.currency(item.averageCost)}</td>
                        <td className="text-right">{fmt.currency(item.sellingPrice)}</td>
                        <td className="text-right">{fmt.currency(item.inventoryValue)}</td>
                        <td><StockBadge status={item.stockStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* в”Ђв”Ђ Sales Tab в”Ђв”Ђ */}
        {tab === 'sales' && (
          <>
            <div className="kpi-grid mb-6">
              {monthly.slice(-3).reverse().map(m => (
                <KpiCard key={`${m.year}-${m.month}`} label={m.monthName} value={fmt.currency(m.revenue)} sub={`${m.orderCount} orders В· ${fmt.currency(m.purchaseExpenses)} purchased`} />
              ))}
            </div>
            <div className="card">
              <div className="card-title">Monthly Revenue vs Purchase Expenses</div>
              <div className="chart-wrap" style={{ height: 320 }}>
                <Bar data={monthlyRevBar} options={CHART_OPTS as any} />
              </div>
            </div>
          </>
        )}

        {/* в”Ђв”Ђ Profit Trend Tab в”Ђв”Ђ */}
        {tab === 'profit' && (
          <>
            <div className="kpi-grid mb-6">
              <KpiCard label="YTD Profit" value={fmt.currency(monthly.reduce((s, m) => s + m.profit, 0))} />
              <KpiCard label="Best Month" value={(() => { const best = [...monthly].sort((a,b) => b.profit - a.profit)[0]; return best ? `${best.monthName}: ${fmt.currency(best.profit)}` : 'вЂ”'; })()} accent="green" />
              <KpiCard label="Avg Monthly Profit" value={fmt.currency(monthly.filter(m=>m.orderCount>0).reduce((s,m)=>s+m.profit,0)/Math.max(monthly.filter(m=>m.orderCount>0).length,1))} />
            </div>
            <div className="card">
              <div className="card-title">Monthly Gross Profit Trend</div>
              <div className="chart-wrap" style={{ height: 320 }}>
                <Line data={profitLine} options={{
                  ...CHART_OPTS as any,
                  scales: {
                    ...CHART_OPTS.scales,
                    y: { ...CHART_OPTS.scales.y, ticks: { color: '#7b80a0', callback: (v: number | string) => `$${Number(v).toLocaleString()}` } },
                  },
                }} />
              </div>
            </div>
          </>
        )}

        {/* в”Ђв”Ђ Top Products Tab в”Ђв”Ђ */}
        {tab === 'topproducts' && (
          <div className="card">
            <div className="section-header mb-4">
              <span className="section-title">Top Selling Products (YTD)</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Product</th><th>SKU</th><th>Category</th>
                    <th className="text-right">Qty Sold</th>
                    <th className="text-right">Total Revenue</th>
                    <th className="text-right">Total Profit</th>
                    <th className="text-right">Profit Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => {
                    const margin = p.totalRevenue > 0 ? (p.totalProfit / p.totalRevenue * 100) : 0;
                    return (
                      <tr key={p.productId}>
                        <td className="text-muted">{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{p.productName}</td>
                        <td className="mono text-muted">{p.sku}</td>
                        <td>{p.categoryName}</td>
                        <td className="text-right">{fmt.number(p.totalQuantitySold)}</td>
                        <td className="text-right">{fmt.currency(p.totalRevenue)}</td>
                        <td className="text-right text-success">{fmt.currency(p.totalProfit)}</td>
                        <td className="text-right">
                          <span className={margin >= 20 ? 'text-success' : margin >= 10 ? 'text-warning' : 'text-danger'}>
                            {fmt.pct(margin)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {topProducts.length === 0 && (
                    <tr><td colSpan={8}><div className="empty-state"><h3>No sales data</h3></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
