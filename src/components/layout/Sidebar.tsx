import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, ClipboardList, BarChart3,
} from 'lucide-react';

const NAV = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/products',  label: 'Products',   icon: Package },
  { to: '/purchases', label: 'Purchases',  icon: ShoppingCart },
  { to: '/orders',    label: 'Orders',     icon: ClipboardList },
  { to: '/reports',   label: 'Reports',    icon: BarChart3 },
];

export function Sidebar() {
  const loc = useLocation();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Package size={22} />
        <span>Core<b style={{ color: 'var(--primary-h)' }}>Stock</b></span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: 11, borderTop: '1px solid var(--border)' }}>
        Demo Mode · In-Memory DB
      </div>
    </aside>
  );
}
