import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { useCart } from '../../context/CartContext';

const DEFAULT_SOLE_COLOR_OPTIONS = [
  { id: 'sc_black', name: { ua: 'Чорна', en: 'Black' }, hex: '#1a1a1a' },
  { id: 'sc_milk', name: { ua: 'Молочна', en: 'Milk' }, hex: '#f4efe6' },
  { id: 'sc_white', name: { ua: 'Біла', en: 'White' }, hex: '#ffffff' },
  { id: 'sc_caramel', name: { ua: 'Карамель', en: 'Caramel' }, hex: '#b5651d' },
];

const FUR_OPTIONS = [
  { id: 'none', name: { ua: 'Без утеплення', en: 'Unlined' } },
  { id: 'fleece', name: { ua: 'Байка', en: 'Fleece' } },
  { id: 'fur', name: { ua: 'Хутро', en: 'Fur' } },
  { id: 'teddy', name: { ua: 'Тедді', en: 'Teddy' } },
];

const MATERIAL_OPTIONS = [
  { id: 'leather', name: { ua: 'Шкіра', en: 'Leather' } },
  { id: 'suede', name: { ua: 'Замша', en: 'Suede' } },
];

export default function Constructor() {
  const { lang, t } = useLanguage();
  const { isAdmin, items, manufacturers, updateProduct } = useAdmin();
  const { addToCart } = useCart();

  const manufacturerList = useMemo(
    () => Object.values(manufacturers || {}),
    [manufacturers]
  );

  const [selectedMfrId, setSelectedMfrId] = useState(
    manufacturerList[0]?.id || 'm1'
  );

  const activeMfr = useMemo(
    () =>
      manufacturers?.[selectedMfrId] ||
      manufacturerList[0] || { id: 'm1', name: 'Виробник 1 (Міла)', soles: [], palettes: {} },
    [manufacturers, selectedMfrId, manufacturerList]
  );

  const availableModels = useMemo(() => {
    const visible = items.filter((item) => isAdmin || !item.isBlocked);
    const forMfr = visible.filter(
      (item) => (item.manufacturerId || 'm1') === activeMfr.id
    );
    return forMfr.length ? forMfr : visible;
  }, [items, isAdmin, activeMfr.id]);

  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedSoleId, setSelectedSoleId] = useState('');
  const [selectedSoleColorId, setSelectedSoleColorId] = useState('sc_black');
  const [selectedFur, setSelectedFur] = useState('fur');
  const [selectedMaterial, setSelectedMaterial] = useState('leather');
  const [primaryColorId, setPrimaryColorId] = useState('');
  const [isComboEnabled, setIsComboEnabled] = useState(false);
  const [secondaryColorId, setSecondaryColorId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);

  const [aiPreviewUrl, setAiPreviewUrl] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    if (!availableModels.length) {
      setSelectedModelId('');
      return;
    }
    if (!availableModels.some((m) => m.id === selectedModelId)) {
      setSelectedModelId(availableModels[0].id);
    }
  }, [availableModels, selectedModelId]);

  const activeModel = useMemo(
    () =>
      availableModels.find((m) => m.id === selectedModelId) ||
      availableModels[0] ||
      null,
    [availableModels, selectedModelId]
  );

  const solesList = useMemo(() => activeMfr?.soles || [], [activeMfr]);

  useEffect(() => {
    if (!solesList.length) {
      setSelectedSoleId('');
      return;
    }
    const matchedSole =
      (activeModel && solesList.find((s) => s.id === activeModel.soleId)) ||
      solesList[0];
    if (matchedSole) {
      setSelectedSoleId(matchedSole.id);
      const firstSoleColor =
        matchedSole.colors?.[0]?.id || DEFAULT_SOLE_COLOR_OPTIONS[0].id;
      setSelectedSoleColorId(firstSoleColor);
    }
  }, [activeModel?.id, solesList]);

  useEffect(() => {
    if (!activeModel) return;
    const mats = activeModel.availableMaterials || ['leather', 'suede'];
    setSelectedMaterial(mats[0] || 'leather');
    setIsComboEnabled(Boolean(activeModel.allowColorCombo));
    const sizes = activeModel.sizes || solesList[0]?.sizes || [36, 37, 38, 39, 40];
    setSelectedSize(sizes[0] ? String(sizes[0]) : '');
    setAiPreviewUrl('');
    setAiMessage('');
  }, [activeModel?.id, solesList]);

  const handleSelectManufacturer = (mfrId) => {
    setSelectedMfrId(mfrId);
    const nextMfr = manufacturers?.[mfrId];
    const nextSoles = nextMfr?.soles || [];
    if (nextSoles[0]) {
      setSelectedSoleId(nextSoles[0].id);
      setSelectedSoleColorId(
        nextSoles[0].colors?.[0]?.id || DEFAULT_SOLE_COLOR_OPTIONS[0].id
      );
    }
    const nextModel = items.find(
      (item) =>
        (isAdmin || !item.isBlocked) &&
        (item.manufacturerId || 'm1') === mfrId
    );
    if (nextModel) {
      setSelectedModelId(nextModel.id);
    }
    setAiPreviewUrl('');
    setAiMessage('');
  };

  const handleSelectModel = (model) => {
    const modelMfrId = model.manufacturerId || 'm1';
    if (modelMfrId !== selectedMfrId) {
      setSelectedMfrId(modelMfrId);
    }
    setSelectedModelId(model.id);
    const targetMfr = manufacturers?.[modelMfrId] || activeMfr;
    const matchedSole =
      targetMfr?.soles?.find((s) => s.id === model.soleId) ||
      targetMfr?.soles?.[0];
    if (matchedSole) {
      setSelectedSoleId(matchedSole.id);
      setSelectedSoleColorId(
        matchedSole.colors?.[0]?.id || DEFAULT_SOLE_COLOR_OPTIONS[0].id
      );
    }
  };

  const activeSole = useMemo(
    () => solesList.find((s) => s.id === selectedSoleId) || solesList[0] || null,
    [solesList, selectedSoleId]
  );

  const soleColorOptions = useMemo(
    () =>
      activeSole?.colors?.length ? activeSole.colors : DEFAULT_SOLE_COLOR_OPTIONS,
    [activeSole]
  );

  const activeSoleColor = useMemo(
    () =>
      soleColorOptions.find((c) => c.id === selectedSoleColorId) ||
      soleColorOptions[0],
    [soleColorOptions, selectedSoleColorId]
  );

  const paletteColors = useMemo(() => {
    const raw = activeMfr?.palettes?.[selectedMaterial] || [];
    const blocked = activeModel?.blockedColorIds || [];
    return raw.filter((c) => !c.isBlocked && !blocked.includes(c.id));
  }, [activeMfr, selectedMaterial, activeModel?.blockedColorIds]);

  useEffect(() => {
    if (!paletteColors.length) {
      setPrimaryColorId('');
      setSecondaryColorId('');
      return;
    }
    if (!paletteColors.some((c) => c.id === primaryColorId)) {
      setPrimaryColorId(paletteColors[0].id);
    }
    if (
      !secondaryColorId ||
      !paletteColors.some((c) => c.id === secondaryColorId)
    ) {
      const second = paletteColors[1] || paletteColors[0];
      setSecondaryColorId(second.id);
    }
  }, [paletteColors, primaryColorId, secondaryColorId]);

  const primaryColor =
    paletteColors.find((c) => c.id === primaryColorId) || paletteColors[0] || null;
  const secondaryColor =
    paletteColors.find((c) => c.id === secondaryColorId) || paletteColors[0] || null;
  const activeFurObj =
    FUR_OPTIONS.find((f) => f.id === selectedFur) || FUR_OPTIONS[0];

  const modelPhoto = activeModel?.gallery?.[0] || activeModel?.image || '';
  const solePhoto = activeSole?.image || '';

  const buildAiPrompt = () => {
    const modelName = activeModel?.title?.ua || 'модель взуття';
    const soleName = activeSole?.name || 'підошва';
    const soleColName = activeSoleColor?.name?.ua || '';
    const matName =
      selectedMaterial === 'leather' ? 'натуральна шкіра' : 'натуральна замша';
    const mainColName = primaryColor?.name?.ua || '';
    const comboPart =
      isComboEnabled && secondaryColor
        ? `, комбіновані деталі (${activeModel?.comboZoneLabel || 'вставка'}): ${secondaryColor.name.ua}`
        : '';
    const furPart =
      selectedFur !== 'none'
        ? `, утеплювач: ${activeFurObj.name.ua}`
        : ', без утеплення';

    return `Студійне фото пари взуття на чистому світлому фоні: форма моделі «${modelName}», підошва «${soleName}» (${soleColName}), верх із матеріалу ${matName}, основний колір: ${mainColName}${comboPart}${furPart}. Зберегти анатомічну форму та реалістичну текстуру матеріалів.`;
  };

  const handleGenerateAiPreview = async () => {
    setAiLoading(true);
    setAiMessage('');
    const prompt = buildAiPrompt();
    const cacheKey = `dim47_ai_preview_${btoa(
      unescape(encodeURIComponent(prompt))
    ).slice(0, 48)}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setAiPreviewUrl(cached);
        setAiMessage('Завантажено збережену AI-візуалізацію для цієї комбінації.');
        setAiLoading(false);
        return;
      }

      const response = await fetch('/api/constructor-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          manufacturerId: activeMfr.id,
          modelImage: modelPhoto,
          soleImage: solePhoto,
          soleColor: activeSoleColor?.name?.ua,
          material: selectedMaterial,
          primaryColor: primaryColor?.name?.ua,
          secondaryColor: isComboEnabled ? secondaryColor?.name?.ua : null,
          fur: selectedFur,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.imageUrl) {
        setAiPreviewUrl(data.imageUrl);
        sessionStorage.setItem(cacheKey, data.imageUrl);
        setAiMessage('AI-візуалізацію згенеровано.');
        setAiLoading(false);
        return;
      }

      setAiPreviewUrl('');
      setAiMessage(
        data?.error ||
          'Промпт сформовано. Перевірте наявність файлу /api/constructor-preview та змінної GEMINI_API_KEY на Vercel.'
      );
    } catch {
      setAiPreviewUrl('');
      setAiMessage(
        'Промпт сформовано. Не вдалося звернутися до /api/constructor-preview.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const basePrice = Number(activeModel?.price) || 3800;
  const comboExtraPrice = isComboEnabled ? 300 : 0;
  const totalPrice = basePrice + comboExtraPrice;
  const minPrepayment = Math.ceil(totalPrice * 0.5);

  const handleAddCustomOrderToCart = () => {
    if (!activeModel || !primaryColor) return;
    const comboSuffix =
      isComboEnabled && secondaryColor
        ? ` + ${secondaryColor.name[lang] || secondaryColor.name.ua}`
        : '';

    addToCart({
      cartItemKey: `custom__${activeMfr.id}__${activeModel.id}__${activeSole?.id || ''}__${activeSoleColor?.id || ''}__${selectedMaterial}__${primaryColor.id}__${isComboEnabled ? secondaryColor?.id || '' : 'single'}__${selectedFur}__${selectedSize || 'custom'}`,
      productId: activeModel.id,
      manufacturerId: activeMfr.id,
      manufacturerName: activeMfr.name,
      isCustomOrder: true,
      prepaymentRequired: minPrepayment,
      title: {
        ua: `${activeModel.title?.ua || 'Індивідуальна пара'} (Індив. пошиття)`,
        en: `${activeModel.title?.en || 'Custom pair'} (Custom order)`,
      },
      price: totalPrice,
      image: aiPreviewUrl || modelPhoto || solePhoto || '',
      material: selectedMaterial,
      lining: selectedFur === 'none' ? null : selectedFur,
      colorId: primaryColor.id,
      colorName: {
        ua: `${primaryColor.name.ua}${comboSuffix} | Підошва: ${activeSoleColor?.name?.ua || ''}`,
        en: `${primaryColor.name.en || primaryColor.name.ua}${comboSuffix} | Sole: ${activeSoleColor?.name?.en || activeSoleColor?.name?.ua || ''}`,
      },
      isNonReturnable: true,
      size: selectedSize || 'Індив.',
      quantity: 1,
    });

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <section className="container" style={{ paddingBlock: '24px 64px' }}>
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          color: '#92400e',
          fontWeight: 700,
          fontSize: '14px',
          marginBottom: '20px',
        }}
      >
        Індивідуальне пошиття без обміну і повернення з мінімальною передоплатою в 50%
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
          Конструктор взуття
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Оберіть виробника, модель, його підошву та колір, утеплювач і колір верху.
        </p>
      </div>

      <div
        style={{
          padding: '14px 16px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#fff',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
          Виробник (підошви та палітра):
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {manufacturerList.map((mfr) => {
            const isSelected = mfr.id === activeMfr.id;
            return (
              <button
                key={mfr.id}
                type="button"
                onClick={() => handleSelectManufacturer(mfr.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #8cbff0' : '1px solid #cbd5e1',
                  backgroundColor: isSelected ? '#8cbff0' : '#f8fafc',
                  color: isSelected ? '#fbf3d1' : '#1e293b',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {mfr.name}
              </button>
            );
          })}
        </div>
      </div>

      {!items.length ? (
        <div
          style={{
            padding: '32px',
            borderRadius: '14px',
            border: '1px dashed #cbd5e1',
            textAlign: 'center',
          }}
        >
          <p style={{ marginBottom: '12px' }}>У каталозі поки немає доданих моделей.</p>
          <Link
            to="/catalog"
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              borderRadius: '999px',
              backgroundColor: '#8cbff0',
              color: '#fbf3d1',
              fontWeight: 600,
            }}
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>
                1. Модель ({activeMfr.name})
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: '10px',
                }}
              >
                {availableModels.map((m) => {
                  const isSelected = m.id === activeModel?.id;
                  const thumb = m.gallery?.[0] || m.image;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModel(m)}
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #8cbff0' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#f0f7ff' : '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: '1 / 1',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#f4f4f5',
                        }}
                      >
                        {thumb && (
                          <img
                            src={thumb}
                            alt={m.title?.ua || ''}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#1e293b',
                          lineHeight: 1.25,
                        }}
                      >
                        {m.title?.[lang] || m.title?.ua}
                      </span>
                    </button>
                  );
                })}
              </div>

              {isAdmin && activeModel && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px dashed #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(activeModel.allowColorCombo)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateProduct(activeModel.id, { allowColorCombo: checked });
                        setIsComboEnabled(checked);
                      }}
                      style={{ marginRight: '6px' }}
                    />
                    Дозволити комбінування 2 кольорів для цієї моделі
                  </label>
                </div>
              )}
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                2. Підошва та колір підошви ({activeMfr.name})
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '10px',
                }}
              >
                {solesList.map((sole) => {
                  const isSelected = sole.id === activeSole?.id;
                  return (
                    <button
                      key={sole.id}
                      type="button"
                      onClick={() => setSelectedSoleId(sole.id)}
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #8cbff0' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#f0f7ff' : '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          height: '64px',
                          borderRadius: '8px',
                          backgroundColor: '#f4f4f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          fontSize: '11px',
                          color: '#64748b',
                        }}
                      >
                        {sole.image ? (
                          <img
                            src={sole.image}
                            alt={sole.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span>Фото підошви</span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                        {sole.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Колір підошви: <strong>{activeSoleColor?.name?.[lang] || activeSoleColor?.name?.ua}</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {soleColorOptions.map((sc) => {
                    const active = sc.id === activeSoleColor?.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setSelectedSoleColorId(sc.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '999px',
                          border: active ? '2px solid #8cbff0' : '1px solid #cbd5e1',
                          backgroundColor: active ? '#f0f7ff' : '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: sc.hex || '#1a1a1a',
                            border: '1px solid rgba(0,0,0,0.2)',
                          }}
                        />
                        {sc.name?.[lang] || sc.name?.ua}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>
                3. Вибір хутра / утеплювача
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {FUR_OPTIONS.map((fur) => {
                  const active = selectedFur === fur.id;
                  return (
                    <button
                      key={fur.id}
                      type="button"
                      onClick={() => setSelectedFur(fur.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: active ? '1.5px solid #8cbff0' : '1px solid #cbd5e1',
                        backgroundColor: active ? '#8cbff0' : '#fff',
                        color: active ? '#fbf3d1' : '#1e293b',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {fur.name[lang] || fur.name.ua}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                4. Матеріал та колір ({activeMfr.name})
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {MATERIAL_OPTIONS.map((mat) => {
                  const active = selectedMaterial === mat.id;
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => setSelectedMaterial(mat.id)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: active ? '1.5px solid #8cbff0' : '1px solid #cbd5e1',
                        backgroundColor: active ? '#8cbff0' : '#fff',
                        color: active ? '#fbf3d1' : '#1e293b',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {mat.name[lang] || mat.name.ua}
                    </button>
                  );
                })}
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Основний колір: <strong>{primaryColor?.name?.[lang] || primaryColor?.name?.ua}</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {paletteColors.map((c) => {
                    const selected = c.id === primaryColor?.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        title={c.name[lang] || c.name.ua}
                        onClick={() => setPrimaryColorId(c.id)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          padding: '2px',
                          border: selected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: '#fff',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            backgroundColor: c.hex || '#cbd5e1',
                            backgroundImage: c.imageUrl ? `url(${c.imageUrl})` : 'none',
                            backgroundSize: 'cover',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={isComboEnabled}
                  onChange={(e) => setIsComboEnabled(e.target.checked)}
                />
                Комбінувати 2 кольори ({activeModel?.comboZoneLabel || 'вставка / задник'})
              </label>

              {isComboEnabled && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Другий колір ({activeModel?.comboZoneLabel || 'вставка / задник'}):{' '}
                    <strong>{secondaryColor?.name?.[lang] || secondaryColor?.name?.ua}</strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {paletteColors.map((c) => {
                      const selected = c.id === secondaryColor?.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          title={c.name[lang] || c.name.ua}
                          onClick={() => setSecondaryColorId(c.id)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            padding: '2px',
                            border: selected ? '2px solid #e84393' : '1px solid #cbd5e1',
                            backgroundColor: '#fff',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              backgroundColor: c.hex || '#cbd5e1',
                              backgroundImage: c.imageUrl ? `url(${c.imageUrl})` : 'none',
                              backgroundSize: 'cover',
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Розмір:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(activeModel?.sizes || activeSole?.sizes || [36, 37, 38, 39, 40]).map((sz) => {
                    const szStr = String(sz);
                    const active = selectedSize === szStr;
                    return (
                      <button
                        key={szStr}
                        type="button"
                        onClick={() => setSelectedSize(szStr)}
                        style={{
                          minWidth: '44px',
                          height: '36px',
                          borderRadius: '8px',
                          border: active ? '1.5px solid #8cbff0' : '1px solid #cbd5e1',
                          backgroundColor: active ? '#8cbff0' : '#fff',
                          color: active ? '#fbf3d1' : '#1e293b',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        {szStr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '18px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '16px' }}>
              Превʼю конфігурації та AI-візуалізація
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <div
                style={{
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  padding: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                  Модель
                </div>
                <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {modelPhoto ? (
                    <img
                      src={modelPhoto}
                      alt="Модель"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Немає фото</span>
                  )}
                </div>
              </div>

              <div
                style={{
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  padding: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                  Підошва ({activeSoleColor?.name?.ua || ''})
                </div>
                <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {solePhoto ? (
                    <img
                      src={solePhoto}
                      alt="Підошва"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: activeSoleColor?.hex || '#1a1a1a',
                        border: '1px solid rgba(0,0,0,0.2)',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {aiPreviewUrl && (
              <div
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#fff',
                  padding: '8px',
                }}
              >
                <img
                  src={aiPreviewUrl}
                  alt="AI візуалізація пари"
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain' }}
                />
              </div>
            )}

            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#334155',
                lineHeight: 1.5,
              }}
            >
              <div>
                <strong>Промпт для AI:</strong> {buildAiPrompt()}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAiPreview}
              disabled={aiLoading}
              style={{
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid #8cbff0',
                backgroundColor: '#eef6ff',
                color: '#1e3a5f',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {aiLoading ? 'Генерую AI-візуалізацію...' : 'Згенерувати AI-візуалізацію пари'}
            </button>

            {aiMessage && (
              <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{aiMessage}</p>
            )}

            <div
              style={{
                paddingTop: '10px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Вартість пари:</span>
                <strong>
                  {totalPrice.toLocaleString('uk-UA')} {t.currency}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309' }}>
                <span>Мінімальна передоплата (50%):</span>
                <strong>
                  {minPrepayment.toLocaleString('uk-UA')} {t.currency}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCustomOrderToCart}
              style={{
                padding: '13px 16px',
                borderRadius: '12px',
                backgroundColor: '#8cbff0',
                color: '#fbf3d1',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              {addedNotice ? '✓ Додано в кошик' : 'Додати індивідуальне замовлення в кошик'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}