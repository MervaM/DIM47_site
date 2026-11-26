import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function AdminBar() {
  const { isAdmin, logout } = useAdmin();
  const barRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!isAdmin || !barRef.current) {
      root.style.setProperty('--admin-bar-height', '0px');
      return;
    }

    const updateBarHeight = () => {
      if (barRef.current) {
        const height = Math.ceil(barRef.current.getBoundingClientRect().height);
        root.style.setProperty('--admin-bar-height', `${height}px`);
      }
    };

    updateBarHeight();

    const observer = new ResizeObserver(updateBarHeight);
    observer.observe(barRef.current);
    window.addEventListener('resize', updateBarHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBarHeight);
      root.style.setProperty('--admin-bar-height', '0px');
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <div
      ref={barRef}
      style={{
        backgroundColor: '#1e293b',
        color: '#fbf3d1',
        fontSize: '13px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}
    >
      <span>Режим адміністратора</span>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link
          to="/vault"
          style={{
            backgroundColor: '#8cbff0',
            color: '#1e293b',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Сховок виробників
        </Link>
        <Link to="/catalog" style={{ textDecoration: 'underline' }}>
          Каталог
        </Link>
        <button
          type="button"
          onClick={logout}
          style={{
            backgroundColor: '#e84393',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Вийти
        </button>
      </div>
    </div>
  );
}