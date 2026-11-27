import { useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { uploadVaultImage } from '../../lib/supabase';

const SOLE_COLOR_PRESETS = [
  { id: 'sc_black', name: { ua: 'Повністю чорна', en: 'All black' }, hex: '#141414', image: '' },
  { id: 'sc_light', name: { ua: 'Світла', en: 'Light' }, hex: '#f3efe6', image: '' },
  { id: 'sc_dark', name: { ua: 'Темна', en: 'Dark' }, hex: '#3a3532', image: '' },
  { id: 'sc_caramel', name: { ua: 'Карамель', en: 'Caramel' }, hex: '#b5651d', image: '' },
  { id: 'sc_beige', name: { ua: 'Бежева', en: 'Beige' }, hex: '#d8c3a5', image: '' },
];

export default function Vault() {
  const {
    isAdmin,
    manufacturers,
    addManufacturerSole,
    updateManufacturerSole,
    toggleSoleBlockedSize,
    deleteManufacturerSole,
    addManufacturerColor,
    toggleManufacturerColorFlag,
    deleteManufacturerColor,
  } = useAdmin();

  const [activeMfrId, setActiveMfrId] = useState('m1');
  const [activeFolder, setActiveFolder] = useState('soles'); // 'soles' | 'leather' | 'suede'
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyStopped, setOnlyStopped] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Стан форми нової підошви
  const [newSoleName, setNewSoleName] = useState('');
  const [newSoleSizes, setNewSoleSizes] = useState('36, 37, 38, 39, 40, 41');
  const [newSoleImage, setNewSoleImage] = useState('');
  const [newSoleFileName, setNewSoleFileName] = useState('');

  // Стан додавання кастомного кольору всередині конкретної підошви (soleId -> draft)
  const [customSoleColorDrafts, setCustomSoleColorDrafts] = useState({});

  // Стан форми нового кольору шкіри/замші
  const [newNameUa, setNewNameUa] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newIsBasic, setNewIsBasic] = useState(true);
  const [newIsNonReturnable, setNewIsNonReturnable] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const mfrList = Object.values(manufacturers || {});
  const currentMfr = manufacturers?.[activeMfrId] || mfrList[0] || null;

  const solesCount = currentMfr?.soles?.length || 0;
  const leatherCount = currentMfr?.palettes?.leather?.length || 0;
  const suedeCount = currentMfr?.palettes?.suede?.length || 0;

  const filteredSoles = useMemo(() => {
    const list = currentMfr?.soles || [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((sole) => {
      const matchesQuery = !q || sole.name.toLowerCase().includes(q);
      const hasStops = (sole.blockedSizes || []).length > 0;
      const matchesStop = !onlyStopped || hasStops;
      return matchesQuery && matchesStop;
    });
  }, [currentMfr, searchQuery, onlyStopped]);

  const filteredColors = useMemo(() => {
    if (activeFolder === 'soles') return [];
    const list = currentMfr?.palettes?.[activeFolder] || [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((color) => {
      const ua = (color.name?.ua || '').toLowerCase();
      const en = (color.name?.en || '').toLowerCase();
      const matchesQuery = !q || ua.includes(q) || en.includes(q);
      const matchesStop = !onlyStopped || Boolean(color.isBlocked);
      return matchesQuery && matchesStop;
    });
  }, [currentMfr, activeFolder, searchQuery, onlyStopped]);

  const getDraftForSole = (soleId) =>
    customSoleColorDrafts[soleId] || { nameUa: '', hex: '#64748b', image: '' };

  const updateDraftForSole = (soleId, patch) => {
    setCustomSoleColorDrafts((prev) => ({
      ...prev,
      [soleId]: {
        ...getDraftForSole(soleId),
        ...patch,
      },
    }));
  };

  const handleNewSolePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentMfr) return;
    setIsUploading(true);
    try {
      const url = await uploadVaultImage(file, `${currentMfr.id}/soles`, 480);
      setNewSoleImage(url);
      setNewSoleFileName(file.name);
    } catch {
      alert('Не вдалося завантажити фото підошви.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSolePhotoUpdate = async (soleId, e) => {
    const file = e.target.files?.[0];
    if (!file || !currentMfr) return;
    setIsUploading(true);
    try {
      const url = await uploadVaultImage(file, `${currentMfr.id}/soles`, 480);
      updateManufacturerSole(currentMfr.id, soleId, { image: url });
    } catch {
      alert('Не вдалося оновити фото підошви.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleToggleSolePresetColor = (sole, preset) => {
    if (!currentMfr) return;
    const currentColors = sole.colors?.length ? sole.colors : SOLE_COLOR_PRESETS;
    const exists = currentColors.some((c) => c.id === preset.id);
    if (exists && currentColors.length === 1) return;
    const nextColors = exists
      ? currentColors.filter((c) => c.id !== preset.id)
      : [...currentColors, { ...preset, image: preset.image || sole.image || '' }];
    updateManufacturerSole(currentMfr.id, sole.id, { colors: nextColors });
  };

  const handleSoleColorVariantPhoto = async (sole, colorId, e) => {
    const file = e.target.files?.[0];
    if (!file || !currentMfr) return;
    setIsUploading(true);
    try {
      const url = await uploadVaultImage(
        file,
        `${currentMfr.id}/soles/${sole.id}/colors`,
        480
      );
      const baseColors = sole.colors?.length ? sole.colors : SOLE_COLOR_PRESETS;
      const nextColors = baseColors.map((c) =>
        c.id === colorId ? { ...c, image: url } : c
      );
      updateManufacturerSole(currentMfr.id, sole.id, {
        colors: nextColors,
        image: sole.image || url,
      });
    } catch {
      alert('Не вдалося завантажити фото для кольору підошви.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveSoleColorVariantPhoto = (sole, colorId) => {
    if (!currentMfr) return;
    const baseColors = sole.colors?.length ? sole.colors : SOLE_COLOR_PRESETS;
    const nextColors = baseColors.map((c) =>
      c.id === colorId ? { ...c, image: '' } : c
    );
    updateManufacturerSole(currentMfr.id, sole.id, { colors: nextColors });
  };

  const handleDraftColorPhoto = async (soleId, e) => {
    const file = e.target.files?.[0];
    if (!file || !currentMfr) return;
    setIsUploading(true);
    try {
      const url = await uploadVaultImage(
        file,
        `${currentMfr.id}/soles/${soleId}/colors`,
        480
      );
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      const currentDraft = getDraftForSole(soleId);
      updateDraftForSole(soleId, {
        image: url,
        nameUa: currentDraft.nameUa.trim() ? currentDraft.nameUa : cleanName,
      });
    } catch {
      alert('Не вдалося завантажити фото кольору.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddCustomSoleColor = (sole) => {
    if (!currentMfr) return;
    const draft = getDraftForSole(sole.id);
    const nameUa = draft.nameUa.trim();
    if (!nameUa) return;

    const baseColors = sole.colors?.length ? sole.colors : SOLE_COLOR_PRESETS;
    const newVariant = {
      id: `sc_${Date.now()}`,
      name: { ua: nameUa, en: nameUa },
      hex: draft.hex || '#64748b',
      image: draft.image || '',
    };

    updateManufacturerSole(currentMfr.id, sole.id, {
      colors: [...baseColors, newVariant],
      image: sole.image || draft.image || '',
    });

    setCustomSoleColorDrafts((prev) => ({
      ...prev,
      [sole.id]: { nameUa: '', hex: '#64748b', image: '' },
    }));
  };

  const handleAddSole = (e) => {
    e.preventDefault();
    if (!newSoleName.trim() || !currentMfr) return;
    const parsedSizes = newSoleSizes
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (!parsedSizes.length) return;

    addManufacturerSole(currentMfr.id, newSoleName.trim(), parsedSizes, {
      image: newSoleImage,
      colors: SOLE_COLOR_PRESETS.slice(0, 3).map((c) => ({
        ...c,
        image: newSoleImage || '',
      })),
    });
    setNewSoleName('');
    setNewSoleSizes('36, 37, 38, 39, 40, 41');
    setNewSoleImage('');
    setNewSoleFileName('');
  };

  const handleEditSoleSizes = (sole) => {
    if (!currentMfr) return;
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
      updateManufacturerSole(currentMfr.id, sole.id, { sizes: parsed });
    }
  };

  const handleColorPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentMfr) return;
    setIsUploading(true);
    try {
      const url = await uploadVaultImage(file, `${currentMfr.id}/${activeFolder}`, 300);
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      setNewImageUrl(url);
      setNewFileName(file.name);
      if (!newNameUa.trim() && cleanName) {
        setNewNameUa(cleanName);
      }
    } catch {
      alert('Не вдалося завантажити фото кольору.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddColor = (e) => {
    e.preventDefault();
    if (!newNameUa.trim() || !currentMfr || activeFolder === 'soles') return;
    addManufacturerColor(currentMfr.id, activeFolder, {
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

  if (!currentMfr) return null;

  const folders = [
    { id: 'soles', title: 'Підошви та сітки', count: solesCount, icon: '👟' },
    { id: 'leather', title: 'Палітра: Шкіра', count: leatherCount, icon: '📁' },
    { id: 'suede', title: 'Палітра: Замша', count: suedeCount, icon: '📂' },
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px 60px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
            Сховок виробників
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Окремі папки по цехах, підошвах із варіантами кольорів/фото та палітрах шкіри і замші
          </p>
        </div>

        <Link
          to="/catalog"
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#fff',
            color: '#1e293b',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          ← Повернутися в каталог
        </Link>
      </div>

      {/* Верхній рівень: Папки виробників */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          padding: '8px',
          backgroundColor: '#f1f5f9',
          borderRadius: '14px',
        }}
      >
        {mfrList.map((mfr) => {
          const isSelected = currentMfr.id === mfr.id;
          return (
            <button
              key={mfr.id}
              type="button"
              onClick={() => {
                setActiveMfrId(mfr.id);
                setSearchQuery('');
              }}
              style={{
                flex: '1 1 220px',
                padding: '12px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                border: isSelected ? '1.5px solid #3b82f6' : '1px solid transparent',
                backgroundColor: isSelected ? '#ffffff' : 'transparent',
                color: isSelected ? '#1e3a5f' : '#475569',
                boxShadow: isSelected ? '0 2px 8px rgba(15, 23, 42, 0.06)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>🏭</span>
              <span>{mfr.name}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Бокова панель папок */}
        <aside
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '320px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', padding: '4px 8px' }}>
            Папки · {currentMfr.name}
          </div>

          {folders.map((folder) => {
            const active = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => {
                  setActiveFolder(folder.id);
                  setSearchQuery('');
                  setOnlyStopped(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: active ? '1.5px solid #8cbff0' : '1px solid #f1f5f9',
                  backgroundColor: active ? '#eef6ff' : '#f8fafc',
                  color: active ? '#1e3a5f' : '#334155',
                  fontWeight: active ? 700 : 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{folder.icon}</span>
                  <span>{folder.title}</span>
                </span>
                <span
                  style={{
                    backgroundColor: active ? '#8cbff0' : '#e2e8f0',
                    color: active ? '#1e293b' : '#475569',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {folder.count}
                </span>
              </button>
            );
          })}

          {isUploading && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Завантаження фото...
            </div>
          )}
        </aside>

        {/* Основна робоча область вибраної папки */}
        <section
          style={{
            gridColumn: 'span 3',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              paddingBottom: '14px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <input
              type="text"
              placeholder={
                activeFolder === 'soles'
                  ? 'Пошук підошви за назвою...'
                  : 'Пошук кольору (укр / en)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: '1 1 240px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
              }}
            />

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: onlyStopped ? '#b91c1c' : '#475569',
                backgroundColor: onlyStopped ? '#fee2e2' : '#f8fafc',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={onlyStopped}
                onChange={(e) => setOnlyStopped(e.target.checked)}
              />
              Тільки зі «Стопом»
            </label>
          </div>

          {activeFolder === 'soles' ? (
            <>
              {/* Форма створення базової підошви зі спільною сіткою */}
              <form
                onSubmit={handleAddSole}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                  + Додати підошву зі спільною розмірною сіткою для {currentMfr.name}
                </span>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    placeholder="Назва підошви (напр. Тракторна підошва)"
                    value={newSoleName}
                    onChange={(e) => setNewSoleName(e.target.value)}
                    style={{
                      flex: '2 1 200px',
                      padding: '9px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <input
                    placeholder="Спільні розміри: 36, 37, 38..."
                    value={newSoleSizes}
                    onChange={(e) => setNewSoleSizes(e.target.value)}
                    style={{
                      flex: '1 1 160px',
                      padding: '9px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <label
                    style={{
                      flex: '1 1 180px',
                      border: '1.5px dashed #8cbff0',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#2b4c6f',
                    }}
                  >
                    {newSoleFileName ? `Фото: ${newSoleFileName}` : '+ Загальне фото підошви'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewSolePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isUploading}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      backgroundColor: '#8cbff0',
                      color: '#1e3a5f',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Додати підошву
                  </button>
                </div>
              </form>

              {filteredSoles.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '14px' }}>
                  У цій папці за обраним фільтром підошов не знайдено.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {filteredSoles.map((sole) => {
                    const activeColors = sole.colors?.length ? sole.colors : SOLE_COLOR_PRESETS;
                    const draft = getDraftForSole(sole.id);

                    return (
                      <div
                        key={sole.id}
                        style={{
                          padding: '14px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '64px',
                                height: '54px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                fontSize: '10px',
                                color: '#94a3b8',
                                flexShrink: 0,
                              }}
                            >
                              {sole.image ? (
                                <img
                                  src={sole.image}
                                  alt={sole.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                              ) : (
                                <span>Немає фото</span>
                              )}
                            </div>
                            <strong style={{ fontSize: '15px', color: '#1e293b' }}>{sole.name}</strong>
                          </div>

                          {currentMfr.soles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteManufacturerSole(currentMfr.id, sole.id)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                cursor: 'pointer',
                              }}
                              title="Видалити підошву"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <label
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              border: '1px dashed #8cbff0',
                              backgroundColor: '#eef6ff',
                              color: '#1e3a5f',
                              cursor: 'pointer',
                            }}
                          >
                            {sole.image ? 'Замінити фото підошви' : '+ Фото підошви'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleSolePhotoUpdate(sole.id, e)}
                              style={{ display: 'none' }}
                            />
                          </label>

                          {sole.image && (
                            <button
                              type="button"
                              onClick={() => updateManufacturerSole(currentMfr.id, sole.id, { image: '' })}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                cursor: 'pointer',
                              }}
                            >
                              × фото
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEditSoleSizes(sole)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            Змінити сітку
                          </button>
                        </div>

                        {/* Варіанти кольорів цієї підошви з окремим фото на кожен варіант */}
                        <div
                          style={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                            Варіанти підошви (колір + своє фото):
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {activeColors.map((colorVar) => {
                              const varLabel = colorVar.name?.ua || colorVar.name || '';
                              return (
                                <div
                                  key={colorVar.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '8px',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    border: '1px solid #f1f5f9',
                                    backgroundColor: '#f8fafc',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span
                                      style={{
                                        width: '28px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        backgroundColor: colorVar.hex || '#e2e8f0',
                                        backgroundImage: colorVar.image ? `url(${colorVar.image})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: '1px solid rgba(0,0,0,0.2)',
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                                      {varLabel}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <label
                                      style={{
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        border: '1px dashed #8cbff0',
                                        backgroundColor: '#eef6ff',
                                        color: '#1e3a5f',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {colorVar.image ? 'Фото кольору ✓' : '+ Фото кольору'}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleSoleColorVariantPhoto(sole, colorVar.id, e)}
                                        style={{ display: 'none' }}
                                      />
                                    </label>

                                    {colorVar.image && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSoleColorVariantPhoto(sole, colorVar.id)}
                                        style={{
                                          padding: '3px 6px',
                                          borderRadius: '6px',
                                          fontSize: '10px',
                                          backgroundColor: '#fee2e2',
                                          color: '#b91c1c',
                                          cursor: 'pointer',
                                        }}
                                        title="Прибрати фото цього кольору"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Додати свій колір підошви (наприклад: Світла, Темна, Повністю чорна) + фото */}
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              paddingTop: '6px',
                              borderTop: '1px dashed #e2e8f0',
                            }}
                          >
                            <input
                              type="color"
                              value={draft.hex || '#64748b'}
                              onChange={(e) => updateDraftForSole(sole.id, { hex: e.target.value })}
                              title="Колір індикатора"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                              }}
                            />
                            <input
                              placeholder="Назва кольору (напр. Світла)"
                              value={draft.nameUa}
                              onChange={(e) => updateDraftForSole(sole.id, { nameUa: e.target.value })}
                              style={{
                                flex: '1 1 130px',
                                padding: '6px 8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '12px',
                              }}
                            />
                            <label
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px dashed #8cbff0',
                                backgroundColor: '#f8fafc',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#2b4c6f',
                                cursor: 'pointer',
                              }}
                            >
                              {draft.image ? 'Фото обрано ✓' : '+ Фото'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleDraftColorPhoto(sole.id, e)}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddCustomSoleColor(sole)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#8cbff0',
                                color: '#1e3a5f',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              + Колір
                            </button>
                          </div>

                          {/* Швидкі пресети */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', paddingTop: '4px' }}>
                            {SOLE_COLOR_PRESETS.map((preset) => {
                              const isEnabled = activeColors.some((c) => c.id === preset.id);
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => handleToggleSolePresetColor(sole, preset)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 7px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    border: isEnabled ? '1px solid #8cbff0' : '1px solid #e2e8f0',
                                    backgroundColor: isEnabled ? '#eef6ff' : '#fff',
                                    color: isEnabled ? '#1e3a5f' : '#94a3b8',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: preset.hex,
                                      border: '1px solid rgba(0,0,0,0.2)',
                                    }}
                                  />
                                  {preset.name.ua}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Спільна розмірна сітка підошви + Стопи */}
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                            Розміри підошви (клік — «Стоп» для всіх кольорів цієї підошви):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {sole.sizes.map((sz) => {
                              const isStopped = (sole.blockedSizes || []).includes(sz);
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => toggleSoleBlockedSize(currentMfr.id, sole.id, sz)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: isStopped ? '#fee2e2' : '#fff',
                                    color: isStopped ? '#b91c1c' : '#334155',
                                    textDecoration: isStopped ? 'line-through' : 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {sz}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* ПАПКИ 2 І 3: ПАЛІТРИ ШКІРИ ТА ЗАМШІ */
            <>
              <form
                onSubmit={handleAddColor}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                  + Додати зразок у папку «{activeFolder === 'leather' ? 'Шкіра' : 'Замша'}»
                </span>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#fff',
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
                    style={{
                      flex: '1 1 160px',
                      padding: '9px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />

                  <input
                    placeholder="Color name (en)"
                    value={newNameEn}
                    onChange={(e) => setNewNameEn(e.target.value)}
                    style={{
                      flex: '1 1 140px',
                      padding: '9px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />

                  <label
                    style={{
                      flex: '1 1 180px',
                      border: '1.5px dashed #8cbff0',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#2b4c6f',
                    }}
                  >
                    {newFileName ? `Фото: ${newFileName}` : '+ Фото текстури'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleColorPhotoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
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
                    disabled={isUploading}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      backgroundColor: '#8cbff0',
                      color: '#1e3a5f',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    + Додати колір
                  </button>
                </div>
              </form>

              {filteredColors.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '14px' }}>
                  У цій папці за обраним фільтром кольорів не знайдено.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {filteredColors.map((color) => (
                    <div
                      key={color.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        backgroundColor: color.isBlocked ? '#fff5f5' : '#f8fafc',
                        opacity: color.isBlocked ? 0.65 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              backgroundColor: color.hex || '#e2e8f0',
                              backgroundImage: color.imageUrl ? `url(${color.imageUrl})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              border: '1px solid rgba(0,0,0,0.2)',
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                              {color.name.ua}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {color.name.en}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteManufacturerColor(currentMfr.id, activeFolder, color.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            cursor: 'pointer',
                          }}
                          title="Видалити колір"
                        >
                          ×
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => toggleManufacturerColorFlag(currentMfr.id, activeFolder, color.id, 'isBasic')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: color.isBasic ? '#dbeafe' : '#fff',
                            color: color.isBasic ? '#1d4ed8' : '#64748b',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer',
                          }}
                        >
                          {color.isBasic ? '★ Базовий' : 'Додатковий'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleManufacturerColorFlag(currentMfr.id, activeFolder, color.id, 'isNonReturnable')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: color.isNonReturnable ? '#fef3c7' : '#fff',
                            color: color.isNonReturnable ? '#b45309' : '#64748b',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer',
                          }}
                        >
                          {color.isNonReturnable ? 'Без обміну/поверн.' : 'Звичайний'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleManufacturerColorFlag(currentMfr.id, activeFolder, color.id, 'isBlocked')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: color.isBlocked ? '#e84393' : '#fee2e2',
                            color: color.isBlocked ? '#fff' : '#b91c1c',
                            cursor: 'pointer',
                          }}
                        >
                          {color.isBlocked ? 'В блоці' : 'Стоп'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}