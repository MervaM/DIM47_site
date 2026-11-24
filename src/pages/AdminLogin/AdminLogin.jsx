import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { isAdmin, login, logout } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(pin)) {
      navigate('/catalog');
    } else {
      setError(true);
    }
  };

  return (
    <section className="container" style={{ paddingBlock: '48px', maxWidth: '400px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Режим адміністратора</h1>

      {isAdmin ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p>Ви авторизовані як адміністратор DiM47.</p>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#8cbff0',
              color: '#fbf3d1',
              fontWeight: 600,
            }}
          >
            Перейти в каталог
          </button>
          <button
            type="button"
            onClick={logout}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              color: '#666',
            }}
          >
            Вийти з режиму адміна
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            placeholder="Введіть PIN-код (4747)"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: error ? '1px solid #e84393' : '1px solid #e5e5e5',
              fontSize: '16px',
            }}
          />
          {error && <span style={{ color: '#e84393', fontSize: '14px' }}>Невірний код доступу</span>}
          <button
            type="submit"
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#8cbff0',
              color: '#fbf3d1',
              fontWeight: 600,
              fontSize: '16px',
            }}
          >
            Увійти
          </button>
        </form>
      )}
    </section>
  );
}