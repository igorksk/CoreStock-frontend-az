import { useEffect, useState } from 'react';
import { ordersApi, productsApi } from '../api';
import type { SalesOrder, CreateSalesOrderDto, Product } from '../types';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/Badge';
import { fmt } from '../utils/format';
import { Plus, Trash2, Eye, XCircle } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';

export default function Orders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, reset, watch, formState: { isSubmitting } } = useForm<CreateSalesOrderDto>({
    defaultValues: { orderDate: new Date().toISOString().split('T')[0], items: [{ productId: 0, quantity: 1, unitPrice: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  const load = async () => {
    const [ord, prod] = await Promise.all([ordersApi.getAll(), productsApi.getAll()]);
    setOrders(ord); setProducts(prod);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const getProductPrice = (productId: number) =>
    products.find(p => p.id === productId)?.sellingPrice ?? 0;

  const estTotal = watchItems?.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || getProductPrice(Number(item.productId)));
  }, 0) ?? 0;

  const onSubmit = async (data: CreateSalesOrderDto) => {
    setError(null);
    try {
      // Auto-fill unit price from product if not set
      const items = data.items.map(item => ({
        ...item,
        productId: Number(item.productId),
        unitPrice: item.unitPrice || getProductPrice(Number(item.productId)),
      }));
      const created = await ordersApi.create({ ...data, items });
      setOrders(os => [created, ...os]);
      setModalOpen(false);
      reset();
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to create order.');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this order? Stock will be returned.')) return;
    try {
      const updated = await ordersApi.cancel(id);
      setOrders(os => os.map(o => o.id === id ? updated : o));
    } catch (e: any) {
      alert(e.response?.data?.error ?? 'Cannot cancel order.');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const updated = await ordersApi.updateStatus(id, status);
    setOrders(os => os.map(o => o.id === id ? updated : o));
  };

  if (loading) return <><div className="topbar">Sales Orders</div><Spinner /></>;

  const totalRevenue = orders.filter(o => o.statusName !== 'Cancelled').reduce((s, o) => s + o.totalRevenue, 0);
  const totalProfit = orders.filter(o => o.statusName !== 'Cancelled').reduce((s, o) => s + o.profit, 0);

  return (
    <>
      <div className="topbar">
        <span>Sales Orders</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Total Revenue: {fmt.currency(totalRevenue)} В· Profit: {fmt.currency(totalProfit)}
        </span>
      </div>
      <div className="page">
        <div className="toolbar">
          <div className="toolbar-left">
            <span className="text-muted">{orders.length} orders</span>
          </div>
          <button className="btn btn-primary" onClick={() => { setError(null); setModalOpen(true); }}>
            <Plus size={16} /> New Order
          </button>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Profit</th>
                  <th className="text-right">Margin</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><span className="mono" style={{ fontWeight: 500 }}>{o.orderNumber}</span></td>
                    <td>
                      <div>{o.customerName ?? 'вЂ”'}</div>
                      {o.customerEmail && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.customerEmail}</div>}
                    </td>
                    <td>{fmt.date(o.orderDate)}</td>
                    <td>{o.items.length}</td>
                    <td className="text-right">{fmt.currency(o.totalRevenue)}</td>
                    <td className={`text-right ${o.profit >= 0 ? 'text-success' : 'text-danger'}`}>{fmt.currency(o.profit)}</td>
                    <td className="text-right">{fmt.pct(o.marginPct)}</td>
                    <td><StatusBadge status={o.statusName} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" title="View details" onClick={() => setDetailOrder(o)}><Eye size={14} /></button>
                        {o.statusName === 'Confirmed' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(o.id, 'Shipped')}>Ship</button>
                        )}
                        {o.statusName === 'Shipped' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(o.id, 'Delivered')}>Deliver</button>
                        )}
                        {(o.statusName === 'Confirmed' || o.statusName === 'Shipped') && (
                          <button className="btn-icon btn-danger" title="Cancel" onClick={() => handleCancel(o.id)}><XCircle size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={9}><div className="empty-state"><h3>No sales orders</h3></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <Modal title="New Sales Order" onClose={() => setModalOpen(false)} size="lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            {error && <div className="alert alert-danger mb-4">{error}</div>}
            <div className="form-grid mb-4">
              <div className="form-field">
                <label>Customer Name</label>
                <input {...register('customerName')} placeholder="Company or individual" />
              </div>
              <div className="form-field">
                <label>Customer Email</label>
                <input type="email" {...register('customerEmail')} placeholder="orders@customer.com" />
              </div>
              <div className="form-field">
                <label>Order Date *</label>
                <input type="date" {...register('orderDate', { required: true })} />
              </div>
              <div className="form-field">
                <label>Notes</label>
                <input {...register('notes')} placeholder="Optional notes" />
              </div>
            </div>

            <div className="section-header">
              <span className="section-title">Line Items</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => append({ productId: 0, quantity: 1, unitPrice: 0 })}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="table-wrap mb-4">
              <table>
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Unit Price ($)</th><th>Stock</th><th></th></tr>
                </thead>
                <tbody>
                  {fields.map((field, i) => {
                    const pid = Number(watchItems?.[i]?.productId);
                    const prod = products.find(p => p.id === pid);
                    return (
                      <tr key={field.id}>
                        <td>
                          <select {...register(`items.${i}.productId`, { required: true, valueAsNumber: true })} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)' }}>
                            <option value="">Select productвЂ¦</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                          </select>
                        </td>
                        <td><input type="number" {...register(`items.${i}.quantity`, { required: true, valueAsNumber: true, min: 1, max: prod?.stockQuantity })} style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)' }} /></td>
                        <td><input type="number" step="0.01" placeholder={prod ? String(prod.sellingPrice) : '0'} {...register(`items.${i}.unitPrice`, { valueAsNumber: true, min: 0 })} style={{ width: 100, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)' }} /></td>
                        <td>
                          {prod ? (
                            <span className={prod.stockQuantity === 0 ? 'text-danger' : prod.isLowStock ? 'text-warning' : 'text-success'}>
                              {prod.stockQuantity} units
                            </span>
                          ) : 'вЂ”'}
                        </td>
                        <td><button type="button" className="btn-icon btn-danger" onClick={() => remove(i)} disabled={fields.length === 1}><Trash2 size={13} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {estTotal > 0 && (
              <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                Estimated Total: <strong style={{ color: 'var(--text)' }}>{fmt.currency(estTotal)}</strong>
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'CreatingвЂ¦' : 'Create Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailOrder && (
        <Modal title={`Order: ${detailOrder.orderNumber}`} onClose={() => setDetailOrder(null)} size="lg">
          <div className="form-grid mb-4">
            <div><span className="text-muted">Customer:</span> <strong>{detailOrder.customerName ?? 'вЂ”'}</strong></div>
            <div><span className="text-muted">Date:</span> {fmt.date(detailOrder.orderDate)}</div>
            <div><span className="text-muted">Status:</span> <StatusBadge status={detailOrder.statusName} /></div>
            <div><span className="text-muted">Revenue:</span> <strong>{fmt.currency(detailOrder.totalRevenue)}</strong></div>
            <div><span className="text-muted">Cost:</span> {fmt.currency(detailOrder.totalCost)}</div>
            <div><span className="text-muted">Profit:</span> <span className="text-success">{fmt.currency(detailOrder.profit)}</span> ({fmt.pct(detailOrder.marginPct)})</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Cost</th><th className="text-right">Line Profit</th></tr></thead>
              <tbody>
                {detailOrder.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td className="mono text-muted">{item.productSKU}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{fmt.currency(item.unitPrice)}</td>
                    <td className="text-right text-muted">{fmt.currency(item.unitCost)}</td>
                    <td className="text-right text-success">{fmt.currency(item.lineProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setDetailOrder(null)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}
