import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

const compressColorImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 240;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function AdminBar() {
  const {
    isAdmin,
    logout,
    manufacturers,
    addManufacturerSole,
    updateManufacturerSole,
    toggleSoleBlockedSize,
    deleteManufacturerSole,
    addManufacturerColor,
    toggleManufacturerColorFlag,
    deleteManufacturerColor,
  } = useAdmin();

  const barRef = useRef(null);

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [activeMfrId, setActiveMfrId] = useState('m1');
  const [sectionTab, setSectionTab] = useState('soles'); // 'soles' | 'leather' | 'suede'

  const [newSoleName, setNewSoleName] = useState('');
  const [newSoleSizes, setNewSoleSizes] = useState('36, 37, 38, 39, 40, 41');

  const [newNameUa, setNewNameUa] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newIsBasic, setNewIsBasic] = useState(true);
  const [newIsNonReturnable, setNewIsNonReturnable] = useState(false);

  // Синхронізуємо фактичну висоту AdminBar з CSS-змінною для мобільного меню Header
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

  const currentMfr = manufacturers[activeMfrId];

  const handleAddSole = (e) => {
    e.preventDefault();
    if (!newSoleName.trim()) return;
    const parsedSizes = newSoleSizes
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (!parsedSizes.length) return;

    addManufacturerSole(activeMfrId, newSoleName.trim(), parsedSizes);
    setNewSoleName('');
    setNewSoleSizes('36, 37, 38, 39, 40, 41');
  };

  const handleEditSoleSizes = (sole) => {
    const input = window.prompt(
      `Розмірна сітка для «${sole.name}» (через кому):`,
      sole.sizes.join(', ')
    );
    if (input === null) return;
    const parsed = input
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (parsed.length) {
      updateManufacturerSole(activeMfrId, sole.id, { sizes: parsed });
    }
  };

  const handleColorPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressColorImage(file);
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      setNewImageUrl(compressedDataUrl);
      setNewFileName(file.name);
      if (!newNameUa.trim() && cleanName) {
        setNewNameUa(cleanName);
      }
    } catch {
      alert('Не вдалося завантажити фото кольору.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddColor = (e) => {
    e.preventDefault();
    if (!newNameUa.trim()) return;
    addManufacturerColor(activeMfrId, sectionTab, {
      name: { ua: newNameUa.trim(), en: newNameEn.trim() || newNameUa.trim() },
      hex: '#e2e8f0',
      imageUrl: newImageUrl || '',
      isBasic: newIsBasic,
      isNonReturnable: newIsNonReturnable,
    });
    setNewNameUa('');
    setNewNameEn('');
    setNewImageUrl('');
    setNewFileName('');
    setNewIsBasic(true);
    setNewIsNonReturnable(false);
  };

  return (
    <>
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
          <button
            type="button"
            onClick={() => setIsPaletteOpen(true)}
            style={{
              backgroundColor: '#8cbff0',
              color: '#1e293b',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Підошви та палітри
          </button>
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

      {isPaletteOpen && currentMfr && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsPaletteOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90svh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Сховок виробників (тільки для адміна)</h2>
              <button type="button" onClick={() => setIsPaletteOpen(false)} style={{ fontSize: '20px' }}>
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {Object.values(manufacturers).map((mfr) => (
                <button
                  key={mfr.id}
                  type="button"
                  onClick={() => setActiveMfrId(mfr.id)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    backgroundColor: activeMfrId === mfr.id ? '#8cbff0' : '#f1f5f9',
                    color: activeMfrId === mfr.id ? '#1e3a5f' : '#475569',
                  }}
                >
                  {mfr.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setSectionTab('soles')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: sectionTab === 'soles' ? '#1e293b' : '#f1f5f9',
                  color: sectionTab === 'soles' ? '#fbf3d1' : '#475569',
                }}
              >
                Підошви та розміри
              </button>
              <button
                type="button"
                onClick={() => setSectionTab('leather')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: sectionTab === 'leather' ? '#1e293b' : '#f1f5f9',
                  color: sectionTab === 'leather' ? '#fbf3d1' : '#475569',
                }}
              >
                Палітра: Шкіра
              </button>
              <button
                type="button"
                onClick={() => setSectionTab('suede')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: sectionTab === 'suede' ? '#1e293b' : '#f1f5f9',
                  color: sectionTab === 'suede' ? '#fbf3d1' : '#475569',
                }}
              >
                Палітра: Замша
              </button>
            </div>

            {sectionTab === 'soles' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  Кожна підошва має власну розмірну сітку. Натисніть на розмір, щоб поставити його на «Стоп»:
                </p>

                {(currentMfr.soles || []).map((sole) => (
                  <div
                    key={sole.id}
                    style={{
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{sole.name}</strong>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditSoleSizes(sole)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#fff',
                          }}
                        >
                          Змінити сітку
                        </button>
                        {currentMfr.soles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteManufacturerSole(activeMfrId, sole.id)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {sole.sizes.map((sz) => {
                        const isStopped = (sole.blockedSizes || []).includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleSoleBlockedSize(activeMfrId, sole.id, sz)}
                            style={{
                              padding: '4px 9px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              border: '1px solid #cbd5e1',
                              backgroundColor: isStopped ? '#fee2e2' : '#fff',
                              color: isStopped ? '#b91c1c' : '#334155',
                              textDecoration: isStopped ? 'line-through' : 'none',
                            }}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <form
                  onSubmit={handleAddSole}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Додати нову підошву для {currentMfr.name}:</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input
                      placeholder="Назва підошви (напр. Лофери 36-40)"
                      value={newSoleName}
                      onChange={(e) => setNewSoleName(e.target.value)}
                      style={{ flex: 2, minWidth: '160px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                    />
                    <input
                      placeholder="36, 37, 38..."
                      value={newSoleSizes}
                      onChange={(e) => setNewSoleSizes(e.target.value)}
                      style={{ flex: 1, minWidth: '120px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#8cbff0',
                        color: '#1e3a5f',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                    >
                      + Підошва
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(currentMfr.palettes[sectionTab] || []).map((color) => (
                    <div
                      key={color.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap',
                        padding: '8px 10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        opacity: color.isBlocked ? 0.5 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: color.hex || '#e2e8f0',
                            backgroundImage: color.imageUrl ? `url(${color.imageUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid rgba(0,0,0,0.2)',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>
                          {color.name.ua} / {color.name.en}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => toggleManufacturerColorFlag(activeMfrId, sectionTab, color.id, 'isBasic')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: color.isBasic ? '#dbeafe' : '#f1f5f9',
                            color: color.isBasic ? '#1d4ed8' : '#64748b',
                          }}
                        >
                          {color.isBasic ? '★ Базовий' : 'Додатковий'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleManufacturerColorFlag(activeMfrId, sectionTab, color.id, 'isNonReturnable')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: color.isNonReturnable ? '#fef3c7' : '#f1f5f9',
                            color: color.isNonReturnable ? '#b45309' : '#64748b',
                          }}
                        >
                          {color.isNonReturnable ? 'Без обміну/поверн.' : 'Звичайний'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleManufacturerColorFlag(activeMfrId, sectionTab, color.id, 'isBlocked')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: color.isBlocked ? '#e84393' : '#fee2e2',
                            color: color.isBlocked ? '#fff' : '#b91c1c',
                          }}
                        >
                          {color.isBlocked ? 'В блоці' : 'Стоп'}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteManufacturerColor(activeMfrId, sectionTab, color.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleAddColor}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        backgroundImage: newImageUrl ? `url(${newImageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid #cbd5e1',
                        flexShrink: 0,
                      }}
                    />

                    <input
                      required
                      placeholder="Назва кольору (укр)"
                      value={newNameUa}
                      onChange={(e) => setNewNameUa(e.target.value)}
                      style={{ flex: 1, minWidth: '130px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                    />

                    <input
                      placeholder="Color name (en)"
                      value={newNameEn}
                      onChange={(e) => setNewNameEn(e.target.value)}
                      style={{ flex: 1, minWidth: '120px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        flex: 1,
                        minWidth: '180px',
                        border: '1.5px dashed #8cbff0',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: '#f8fafc',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#2b4c6f',
                      }}
                    >
                      {newFileName ? `Фото: ${newFileName}` : '+ Завантажити фото з папки'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleColorPhotoChange}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {newImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewImageUrl('');
                          setNewFileName('');
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#fff',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#475569',
                        }}
                      >
                        Прибрати фото
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newIsBasic}
                          onChange={(e) => setNewIsBasic(e.target.checked)}
                        />
                        Базовий (видно одразу)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newIsNonReturnable}
                          onChange={(e) => setNewIsNonReturnable(e.target.checked)}
                        />
                        Без обміну і повернення
                      </label>
                    </div>

                    <button
                      type="submit"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#8cbff0',
                        color: '#1e3a5f',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                    >
                      + Додати колір
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}