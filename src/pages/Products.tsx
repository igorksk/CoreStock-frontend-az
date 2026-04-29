import { useEffect, useState, useMemo } from 'react';
import { productsApi, catalogApi } from '../api';
import type { Product, CreateProductDto, UpdateProductDto, Category, Brand } from '../types';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { fmt } from '../utils/format';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';

type FormData = CreateProductDto;

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [sortCol, setSortCol] = useState<keyof Product>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();

  const load = async () => {
    const [p, c, b] = await Promise.all([productsApi.getAll(), catalogApi.getCategories(), catalogApi.getBrands()]);
    setProducts(p); setCategories(c); setBrands(b);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => {
    let list = products.filter(p =>
      (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())) &&
      (!catFilter || String(p.categoryId) === catFilter)
    );
    list = [...list].sort((a, b) => {
      const av = a[sortCol] as any, bv = b[sortCol] as any;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [products, search, catFilter, sortCol, sortDir]);

  const openCreate = () => { setEditProduct(null); reset({}); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    reset({ name: p.name, sku: p.sku, description: p.description, categoryId: p.categoryId, brandId: p.brandId, purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, minStockLevel: p.minStockLevel });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    if (editProduct) {
      const updated = await productsApi.update(editProduct.id, data as UpdateProductDto);
      setProducts(ps => ps.map(p => p.id === updated.id ? updated : p));
    } else {
      const created = await productsApi.create(data);
      setProducts(ps => [...ps, created]);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this product?')) return;
    await productsApi.delete(id);
    setProducts(ps => ps.filter(p => p.id !== id));
  };

  const sortBy = (col: keyof Product) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const arrow = (col: keyof Product) => sortCol === col ? (sortDir === 'asc' ? ' в–І' : ' в–ј') : '';

  const lowStockCount = products.filter(p => p.isLowStock).length;

  if (loading) return <><div className="topbar">Products</div><Spinner /></>;

  return (
    <>
      <div className="topbar">Products</div>
      <div className="page">
        {lowStockCount > 0 && (
          <div className="alert alert-warning flex items-center gap-2 mb-4">
            <AlertTriangle size={16} /> {lowStockCount} product{lowStockCount > 1 ? 's' : ''} at or below minimum stock level
          </div>
        )}

        <div className="toolbar">
          <div className="toolbar-left">
            <input className="search-input" placeholder="Search by name or SKUвЂ¦" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="search-input" style={{ width: 160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Product</button>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="sortable" onClick={() => sortBy('name')}>Product{arrow('name')}</th>
                  <th className="sortable" onClick={() => sortBy('categoryName')}>Category{arrow('categoryName')}</th>
                  <th className="sortable" onClick={() => sortBy('brandName')}>Brand{arrow('brandName')}</th>
                  <th className="sortable text-right" onClick={() => sortBy('sellingPrice')}>Price{arrow('sellingPrice')}</th>
                  <th className="sortable text-right" onClick={() => sortBy('averageCost')}>Avg Cost{arrow('averageCost')}</th>
                  <th className="sortable text-right" onClick={() => sortBy('margin')}>Margin{arrow('margin')}</th>
                  <th className="sortable text-right" onClick={() => sortBy('stockQuantity')}>Stock{arrow('stockQuantity')}</th>
                  <th className="text-right">Inv. Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className={p.stockQuantity === 0 ? 'row-out-of-stock' : p.isLowStock ? 'row-low-stock' : ''}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }} className="mono">{p.sku}</div>
                    </td>
                    <td>{p.categoryName}</td>
                    <td>{p.brandName}</td>
                    <td className="text-right">{fmt.currency(p.sellingPrice)}</td>
                    <td className="text-right text-muted">{fmt.currency(p.averageCost)}</td>
                    <td className="text-right">
                      <span className={p.margin >= 20 ? 'text-success' : p.margin >= 10 ? 'text-warning' : 'text-danger'}>
                        {fmt.pct(p.margin)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={p.stockQuantity === 0 ? 'text-danger' : p.isLowStock ? 'text-warning' : ''}>
                        {p.stockQuantity}
                      </span>
                      {p.isLowStock && <AlertTriangle size={12} style={{ color: 'var(--warning)', marginLeft: 4, verticalAlign: 'middle' }} />}
                    </td>
                    <td className="text-right text-muted">{fmt.currency(p.inventoryValue)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn-icon" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9}><div className="empty-state"><h3>No products found</h3></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalOpen && (
          <Modal title={editProduct ? 'Edit Product' : 'New Product'} onClose={() => setModalOpen(false)}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-grid">
                <div className="form-field form-full">
                  <label>Product Name *</label>
                  <input {...register('name', { required: 'Required' })} placeholder="e.g. AMD Ryzen 9 7950X" />
                  {errors.name && <span className="form-error">{errors.name.message}</span>}
                </div>
                <div className="form-field">
                  <label>SKU *</label>
                  <input {...register('sku', { required: 'Required' })} placeholder="CPU-AMD-001" disabled={!!editProduct} />
                  {errors.sku && <span className="form-error">{errors.sku.message}</span>}
                </div>
                <div className="form-field">
                  <label>Min Stock Level</label>
                  <input type="number" {...register('minStockLevel', { valueAsNumber: true, min: 0 })} defaultValue={5} />
                </div>
                <div className="form-field">
                  <label>Category *</label>
                  <select {...register('categoryId', { required: true, valueAsNumber: true })}>
                    <option value="">SelectвЂ¦</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Brand *</label>
                  <select {...register('brandId', { required: true, valueAsNumber: true })}>
                    <option value="">SelectвЂ¦</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Purchase Price ($) *</label>
                  <input type="number" step="0.01" {...register('purchasePrice', { required: true, valueAsNumber: true, min: 0 })} />
                </div>
                <div className="form-field">
                  <label>Selling Price ($) *</label>
                  <input type="number" step="0.01" {...register('sellingPrice', { required: true, valueAsNumber: true, min: 0 })} />
                </div>
                <div className="form-field form-full">
                  <label>Description</label>
                  <textarea {...register('description')} rows={2} placeholder="Optional description" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'SavingвЂ¦' : editProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </>
  );
}
