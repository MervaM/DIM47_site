import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState('');
  const [showRecoveryPass, setShowRecoveryPass] = useState(true);
  const [recoveryStatus, setRecoveryStatus] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [newHint, setNewHint] = useState('');
  const [showNewPass, setShowNewPass] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  const {
    isAdmin,
    login,
    logout,
    adminPin,
    recoveryHint,
    changeAdminPin,
    resetAdminPin,
    defaultAdminPin,
  } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(pin)) {
      setError(false);
      navigate('/catalog');
    } else {
      setError(true);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setSaveStatus('Введіть новий пароль.');
      return;
    }
    changeAdminPin(newPassword.trim(), newHint.trim());
    setNewPassword('');
    setSaveStatus('Новий пароль збережено.');
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    const targetPin = recoveryPin.trim() || defaultAdminPin;
    resetAdminPin(targetPin);
    setRecoveryPin('');
    setRecoveryStatus(`Пароль оновлено на "${targetPin}". Вхід виконано.`);
  };

  return (
    <section className="container" style={{ paddingBlock: '48px', maxWidth: '420px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Режим адміністратора</h1>

      {isAdmin ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
            }}
          >
            <div>Ви авторизовані як адміністратор DiM47.</div>
            <div style={{ marginTop: '6px', fontSize: '13px', color: '#475569' }}>
              Поточний пароль: <strong>{adminPin}</strong>
            </div>
            {recoveryHint && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                Підказка для відновлення: {recoveryHint}
              </div>
            )}
          </div>

          <form
            onSubmit={handleChangePassword}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '15px' }}>Встановити / змінити свій пароль</div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type={showNewPass ? 'text' : 'password'}
                placeholder="Новий пароль"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setSaveStatus('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPass((prev) => !prev)}
                style={{
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {showNewPass ? 'Сховати' : 'Показати'}
              </button>
            </div>

            <input
              type="text"
              placeholder="Підказка для відновлення (необов'язково)"
              value={newHint}
              onChange={(e) => setNewHint(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
              }}
            />

            {saveStatus && (
              <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 500 }}>
                {saveStatus}
              </span>
            )}

            <button
              type="submit"
              style={{
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#8cbff0',
                color: '#fbf3d1',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Зберегти пароль
            </button>
          </form>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Введіть пароль"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: error ? '1px solid #e84393' : '1px solid #e5e5e5',
                  fontSize: '16px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  backgroundColor: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {showPassword ? 'Сховати' : 'Показати'}
              </button>
            </div>

            {error && (
              <span style={{ color: '#e84393', fontSize: '14px' }}>
                Невірний пароль. Спробуйте ще раз або скористайтесь відновленням нижче.
              </span>
            )}

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

          <button
            type="button"
            onClick={() => {
              setShowRecovery((prev) => !prev);
              setRecoveryStatus('');
            }}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              padding: '4px 0',
              color: '#2563eb',
              fontSize: '14px',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {showRecovery ? 'Приховати відновлення пароля' : 'Забули пароль? Відновити'}
          </button>

          {showRecovery && (
            <form
              onSubmit={handleResetPassword}
              style={{
                padding: '14px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Відновлення пароля</div>

              {recoveryHint && (
                <div style={{ fontSize: '13px', color: '#475569' }}>
                  Ваша підказка: <strong>{recoveryHint}</strong>
                </div>
              )}

              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Введіть новий пароль або залиште поле порожнім для скидання на стандартний ({defaultAdminPin}).
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showRecoveryPass ? 'text' : 'password'}
                  placeholder={`Новий пароль (або ${defaultAdminPin})`}
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowRecoveryPass((prev) => !prev)}
                  style={{
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    fontSize: '12px',
                  }}
                >
                  {showRecoveryPass ? 'Сховати' : 'Показати'}
                </button>
              </div>

              {recoveryStatus && (
                <span style={{ fontSize: '13px', color: '#15803d' }}>{recoveryStatus}</span>
              )}

              <button
                type="submit"
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#8cbff0',
                  color: '#fbf3d1',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Відновити та увійти
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}