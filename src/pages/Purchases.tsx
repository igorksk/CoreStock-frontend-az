import { useEffect, useState } from 'react';
import { purchasesApi, catalogApi, productsApi } from '../api';
import type { Purchase, CreatePurchaseDto, Supplier, Product } from '../types';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/Badge';
import { fmt } from '../utils/format';
import { Plus, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);

  const { register, handleSubmit, control, reset, formState: { isSubmitting } } = useForm<CreatePurchaseDto>({
    defaultValues: { orderDate: new Date().toISOString().split('T')[0], items: [{ productId: 0, quantity: 1, unitCost: 0 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const load = async () => {
    const [pur, sup, prod] = await Promise.all([purchasesApi.getAll(), catalogApi.getSuppliers(), productsApi.getAll()]);
    setPurchases(pur); setSuppliers(sup); setProducts(prod);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onSubmit = async (data: CreatePurchaseDto) => {
    const created = await purchasesApi.create(data);
    setPurchases(ps => [created, ...ps]);
    setModalOpen(false);
    reset();
  };

  const handleReceive = async (id: number) => {
    const updated = await purchasesApi.receive(id);
    setPurchases(ps => ps.map(p => p.id === id ? updated : p));
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this purchase order?')) return;
    const updated = await purchasesApi.cancel(id);
    setPurchases(ps => ps.map(p => p.id === id ? updated : p));
  };

  if (loading) return <><div className="topbar">Purchases</div><Spinner /></>;

  return (
    <>
      <div className="topbar">Purchases</div>
      <div className="page">
        <div className="toolbar">
          <div className="toolbar-left">
            <span className="text-muted">{purchases.length} purchase orders</span>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> New Purchase Order</button>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td><span className="mono" style={{ fontWeight: 500 }}>{p.purchaseNumber}</span></td>
                    <td>{p.supplierName}</td>
                    <td>{fmt.date(p.orderDate)}</td>
                    <td>{p.items.length} line{p.items.length !== 1 ? 's' : ''}</td>
                    <td className="text-right" style={{ fontWeight: 500 }}>{fmt.currency(p.totalAmount)}</td>
                    <td><StatusBadge status={p.statusName} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" title="View details" onClick={() => setDetailPurchase(p)}><Eye size={14} /></button>
                        {p.statusName === 'Confirmed' && (
                          <button className="btn-icon" title="Mark as Received" onClick={() => handleReceive(p.id)}><CheckCircle size={14} style={{ color: 'var(--success)' }} /></button>
                        )}
                        {(p.statusName === 'Draft' || p.statusName === 'Confirmed') && (
                          <button className="btn-icon btn-danger" title="Cancel" onClick={() => handleCancel(p.id)}><XCircle size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><h3>No purchase orders</h3></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <Modal title="New Purchase Order" onClose={() => setModalOpen(false)} size="lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid mb-4">
              <div className="form-field">
                <label>Supplier *</label>
                <select {...register('supplierId', { required: true, valueAsNumber: true })}>
                  <option value="">Select supplierвЂ¦</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Order Date *</label>
                <input type="date" {...register('orderDate', { required: true })} />
              </div>
              <div className="form-field form-full">
                <label>Notes</label>
                <input {...register('notes')} placeholder="Optional notes" />
              </div>
            </div>

            <div className="section-header">
              <span className="section-title">Line Items</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => append({ productId: 0, quantity: 1, unitCost: 0 })}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="table-wrap mb-4">
              <table>
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Unit Cost ($)</th><th></th></tr>
                </thead>
                <tbody>
                  {fields.map((field, i) => (
                    <tr key={field.id}>
                      <td>
                        <select {...register(`items.${i}.productId`, { required: true, valueAsNumber: true })} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)' }}>
                          <option value="">Select productвЂ¦</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </td>
                      <td><input type="number" {...register(`items.${i}.quantity`, { required: true, valueAsNumber: true, min: 1 })} style={{ width: 80, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)' }} /></td>
                      <td><input type="number" step="0.01" {...register(`items.${i}.unitCost`, { required: true, valueAsNumber: true, min: 0 })} style={{ width: 100, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)' }} /></td>
                      <td><button type="button" className="btn-icon btn-danger" onClick={() => remove(i)} disabled={fields.length === 1}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'CreatingвЂ¦' : 'Create Purchase Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailPurchase && (
        <Modal title={`Purchase Order: ${detailPurchase.purchaseNumber}`} onClose={() => setDetailPurchase(null)} size="lg">
          <div className="form-grid mb-4">
            <div><span className="text-muted">Supplier:</span> <strong>{detailPurchase.supplierName}</strong></div>
            <div><span className="text-muted">Date:</span> {fmt.date(detailPurchase.orderDate)}</div>
            <div><span className="text-muted">Status:</span> <StatusBadge status={detailPurchase.statusName} /></div>
            <div><span className="text-muted">Total:</span> <strong>{fmt.currency(detailPurchase.totalAmount)}</strong></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th className="text-right">Qty</th><th className="text-right">Unit Cost</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {detailPurchase.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td className="mono text-muted">{item.productSKU}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{fmt.currency(item.unitCost)}</td>
                    <td className="text-right">{fmt.currency(item.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setDetailPurchase(null)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}
