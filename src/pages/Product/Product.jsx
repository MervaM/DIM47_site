import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { useCart } from '../../context/CartContext';

const MATERIAL_OPTIONS = {
  leather: { ua: 'Шкіра', en: 'Leather' },
  suede: { ua: 'Замша', en: 'Suede' },
};

const ALL_LINING_OPTIONS = [
  { id: 'fleece', label: { ua: 'Байка', en: 'Fleece' } },
  { id: 'fur', label: { ua: 'Хутро', en: 'Fur' } },
  { id: 'teddy', label: { ua: 'Теді', en: 'Teddy' } },
];

const INSOLE_CM_BY_SIZE = {
  35: 23,
  36: 23.5,
  37: 24,
  38: 24.5,
  39: 25.5,
  40: 26,
  41: 26.5,
  42: 27.5,
  43: 28,
};

const getInsoleCm = (size, customMap) => {
  if (customMap && customMap[size] != null) return customMap[size];
  if (INSOLE_CM_BY_SIZE[size] != null) return INSOLE_CM_BY_SIZE[size];
  const numeric = Number(size);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return Number((23.5 + (numeric - 36) * 0.65).toFixed(1));
  }
  return null;
};

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { items, manufacturers } = useAdmin();
  const { addToCart } = useCart();

  const product = useMemo(
    () => items.find((item) => String(item.id) === String(id)) || null,
    [items, id]
  );

  const gallery = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      return product.gallery;
    }
    return product.image ? [product.image] : [];
  }, [product]);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const availableMaterials = useMemo(() => {
    return Array.isArray(product?.availableMaterials) && product.availableMaterials.length > 0
      ? product.availableMaterials
      : ['leather', 'suede'];
  }, [product]);

  const liningOptions = useMemo(() => {
    const allowedIds =
      Array.isArray(product?.availableLinings) && product.availableLinings.length > 0
        ? product.availableLinings
        : ['fleece', 'fur'];
    const filtered = ALL_LINING_OPTIONS.filter((opt) => allowedIds.includes(opt.id));
    return filtered.length > 0 ? filtered : ALL_LINING_OPTIONS.slice(0, 2);
  }, [product]);

  const [selectedMaterial, setSelectedMaterial] = useState('leather');
  const [selectedLining, setSelectedLining] = useState('fleece');
  const [selectedColorId, setSelectedColorId] = useState('');
  const [showMoreColors, setShowMoreColors] = useState(false);
  const [selectedSoleColorId, setSelectedSoleColorId] = useState('');
  const [selectedSize, setSelectedSize] = useState(null);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const manufacturer = useMemo(() => {
    if (!product) return null;
    return manufacturers?.[product.manufacturerId] || manufacturers?.m1 || null;
  }, [product, manufacturers]);

  const sole = useMemo(() => {
    if (!manufacturer || !product) return null;
    return (
      manufacturer.soles?.find((s) => s.id === product.soleId) ||
      manufacturer.soles?.[0] ||
      null
    );
  }, [manufacturer, product]);

  const soleColors = useMemo(() => {
    if (!sole) return [];
    return Array.isArray(sole.colors) ? sole.colors : [];
  }, [sole]);

  const paletteColors = useMemo(() => {
    const rawList = manufacturer?.palettes?.[selectedMaterial] || [];
    const blockedOnProduct = new Set(product?.blockedColorIds || []);
    return rawList.map((color) => ({
      ...color,
      isBasic: color.isBasic !== false,
      isUnavailable: Boolean(color.isBlocked) || blockedOnProduct.has(color.id),
    }));
  }, [manufacturer, selectedMaterial, product]);

  const basicColors = useMemo(
    () => paletteColors.filter((c) => c.isBasic),
    [paletteColors]
  );

  const extraColors = useMemo(
    () => paletteColors.filter((c) => !c.isBasic),
    [paletteColors]
  );

  const sizesList = useMemo(() => {
    const baseSizes =
      Array.isArray(product?.sizes) && product.sizes.length > 0
        ? product.sizes
        : sole?.sizes || [36, 37, 38, 39, 40];

    const blockedSet = new Set([
      ...(product?.blockedSizes || []),
      ...(sole?.blockedSizes || []),
    ]);

    return baseSizes.map((sz) => ({
      value: sz,
      insoleCm: getInsoleCm(sz, product?.insoleBySize || sole?.insoleBySize),
      isBlocked: blockedSet.has(sz),
    }));
  }, [product, sole]);

  useEffect(() => {
    setActivePhotoIdx(0);
    const firstMat = availableMaterials[0] || 'leather';
    setSelectedMaterial(firstMat);
    setShowMoreColors(false);
    setIsSizeChartOpen(false);
    setAddedNotice(false);
  }, [product?.id, availableMaterials]);

  useEffect(() => {
    setSelectedLining((prev) =>
      liningOptions.some((opt) => opt.id === prev) ? prev : liningOptions[0]?.id || 'fleece'
    );
  }, [liningOptions]);

  useEffect(() => {
    const preferredPool = basicColors.length > 0 ? basicColors : paletteColors;
    const firstAvailableColor =
      preferredPool.find((c) => !c.isUnavailable) ||
      paletteColors.find((c) => !c.isUnavailable);

    if (firstAvailableColor) {
      setSelectedColorId((prev) =>
        paletteColors.some((c) => c.id === prev && !c.isUnavailable)
          ? prev
          : firstAvailableColor.id
      );
    } else {
      setSelectedColorId(paletteColors[0]?.id || '');
    }
  }, [paletteColors, basicColors]);

  useEffect(() => {
    if (!soleColors.length) {
      setSelectedSoleColorId('');
      return;
    }
    setSelectedSoleColorId((prev) =>
      soleColors.some((sc) => sc.id === prev) ? prev : soleColors[0].id
    );
  }, [soleColors]);

  useEffect(() => {
    const firstAvailableSize = sizesList.find((s) => !s.isBlocked);
    if (firstAvailableSize) {
      setSelectedSize((prev) =>
        sizesList.some((s) => s.value === prev && !s.isBlocked)
          ? prev
          : firstAvailableSize.value
      );
    } else {
      setSelectedSize(sizesList[0]?.value ?? null);
    }
  }, [sizesList]);

  if (!product) {
    return (
      <section style={{ padding: '48px 16px', maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
          {lang === 'ua' ? 'Модель не знайдено' : 'Product not found'}
        </h1>
        <Link
          to="/catalog"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: '999px',
            backgroundColor: '#8cbff0',
            color: '#fbf3d1',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {lang === 'ua' ? 'Каталог' : 'Catalog'}
        </Link>
      </section>
    );
  }

  const titleText = product.title?.[lang] || product.title?.ua || product.title?.en || '';
  const cardMaterialText =
    product.material?.[lang] || product.material?.ua || product.material?.en || '';

  const chosenColorObj =
    paletteColors.find((c) => c.id === selectedColorId) || paletteColors[0] || null;

  const isCustomPrepaymentColor = Boolean(
    chosenColorObj && (!chosenColorObj.isBasic || chosenColorObj.isNonReturnable)
  );

  const chosenSoleColorObj =
    soleColors.find((sc) => sc.id === selectedSoleColorId) || soleColors[0] || null;

  const chosenSolePreviewImage = chosenSoleColorObj?.image || sole?.image || '';

  const chosenLiningObj =
    liningOptions.find((l) => l.id === selectedLining) || liningOptions[0];

  const chosenSizeObj = sizesList.find((s) => s.value === selectedSize);
  const chosenInsoleCm = chosenSizeObj?.insoleCm ?? getInsoleCm(selectedSize);

  const canAddToCart =
    Boolean(selectedSize) &&
    !chosenSizeObj?.isBlocked &&
    (!chosenColorObj || !chosenColorObj.isUnavailable);

  const handleAddToCart = () => {
    if (!canAddToCart || !addToCart) return;

    const soleColorNameObj =
      typeof chosenSoleColorObj?.name === 'object'
        ? chosenSoleColorObj.name
        : { ua: chosenSoleColorObj?.name || '', en: chosenSoleColorObj?.name || '' };

    const soleColorIdValue = chosenSoleColorObj?.id || '';
    const colorIdValue = chosenColorObj?.id || '';

    const cartItemKey = [
      product.id,
      selectedSize,
      selectedMaterial,
      selectedLining,
      colorIdValue,
      soleColorIdValue,
    ].join('__');

    addToCart({
      cartItemKey,
      id: product.id,
      title: product.title,
      price: Number(product.price) || 0,
      image: gallery[activePhotoIdx] || product.image || '',
      size: selectedSize,
      insoleCm: chosenInsoleCm,
      material: selectedMaterial,
      materialLabel: MATERIAL_OPTIONS[selectedMaterial] || {
        ua: cardMaterialText,
        en: cardMaterialText,
      },
      lining: selectedLining,
      liningLabel: chosenLiningObj?.label,
      colorId: colorIdValue,
      colorName: chosenColorObj?.name || { ua: '', en: '' },
      soleId: sole?.id || '',
      soleName: sole?.name || '',
      soleColorId: soleColorIdValue,
      soleColorName: soleColorNameObj,
      isNonReturnable: isCustomPrepaymentColor,
      quantity: 1,
    });

    setAddedNotice(true);
  };

  const renderColorChip = (color) => {
    const isSelected = chosenColorObj?.id === color.id;
    const label = color.name?.[lang] || color.name?.ua || '';
    return (
      <button
        key={color.id}
        type="button"
        disabled={color.isUnavailable}
        onClick={() => setSelectedColorId(color.id)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '7px 12px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 600,
          border: isSelected ? '1.5px solid #8cbff0' : '1px solid #cbd5e1',
          backgroundColor: color.isUnavailable
            ? '#f1f5f9'
            : isSelected
            ? '#eef6ff'
            : '#fff',
          color: color.isUnavailable ? '#94a3b8' : '#1e293b',
          opacity: color.isUnavailable ? 0.55 : 1,
          cursor: color.isUnavailable ? 'not-allowed' : 'pointer',
        }}
      >
        <span
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: color.hex || '#e2e8f0',
            backgroundImage: color.imageUrl ? `url(${color.imageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}
        />
        <span>{label}</span>
      </button>
    );
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
    marginBottom: '8px',
  };

  return (
    <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 64px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/catalog"
          style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textDecoration: 'none' }}
        >
          ← {lang === 'ua' ? 'Каталог' : 'Catalog'}
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '28px',
          alignItems: 'start',
        }}
      >
        {/* Галерея фото */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 5',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#f4f4f5',
              border: '1px solid #e2e8f0',
            }}
          >
            {gallery[activePhotoIdx] ? (
              <img
                src={gallery[activePhotoIdx]}
                alt={titleText}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : null}

            {product.inStock && (
              <span
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.94)',
                  color: '#15803d',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: '999px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #bbf7d0',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.25)',
                    flexShrink: 0,
                  }}
                />
                {lang === 'ua' ? 'Наявність' : 'In stock'}
              </span>
            )}
          </div>

          {gallery.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  style={{
                    width: '64px',
                    height: '76px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    padding: 0,
                    border: activePhotoIdx === idx ? '2px solid #8cbff0' : '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`${titleText} ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Інформація та опції */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            {cardMaterialText && (
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                {cardMaterialText}
              </p>
            )}
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              {titleText}
            </h1>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginTop: '10px' }}>
              {(Number(product.price) || 0).toLocaleString('uk-UA')} {t.currency}
            </div>
          </div>

          {/* 1. Матеріал: Шкіра / Замша */}
          <div>
            <div style={labelStyle}>
              {lang === 'ua' ? 'Матеріал:' : 'Material:'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {availableMaterials.map((matKey) => {
                const label =
                  MATERIAL_OPTIONS[matKey]?.[lang] ||
                  MATERIAL_OPTIONS[matKey]?.ua ||
                  matKey;
                const active = selectedMaterial === matKey;
                return (
                  <button
                    key={matKey}
                    type="button"
                    onClick={() => setSelectedMaterial(matKey)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: active ? '1.5px solid #8cbff0' : '1px solid #cbd5e1',
                      backgroundColor: active ? '#eef6ff' : '#fff',
                      color: active ? '#1e3a5f' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Утеплення: підключені варіанти з каталогу */}
          {liningOptions.length > 0 && (
            <div>
              <div style={labelStyle}>
                {lang === 'ua' ? 'Утеплення:' : 'Lining:'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {liningOptions.map((opt) => {
                  const active = selectedLining === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedLining(opt.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: active ? '1.5px solid #8cbff0' : '1px solid #cbd5e1',
                        backgroundColor: active ? '#eef6ff' : '#fff',
                        color: active ? '#1e3a5f' : '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label[lang] || opt.label.ua}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Колір: базові + «Більше кольорів» */}
          {paletteColors.length > 0 && (
            <div>
              <div style={labelStyle}>
                {lang === 'ua' ? 'Колір:' : 'Color:'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(basicColors.length > 0 ? basicColors : paletteColors).map(renderColorChip)}
                </div>

                {basicColors.length > 0 && extraColors.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowMoreColors((prev) => !prev)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f8fafc',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {lang === 'ua'
                        ? showMoreColors
                          ? 'Сховати додаткові кольори ▲'
                          : 'Більше кольорів ▼'
                        : showMoreColors
                        ? 'Hide extra colors ▲'
                        : 'More colors ▼'}
                    </button>

                    {showMoreColors && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {extraColors.map(renderColorChip)}
                      </div>
                    )}
                  </div>
                )}

                {isCustomPrepaymentColor && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#b45309',
                      backgroundColor: '#fef3c7',
                      padding: '8px 12px',
                      borderRadius: '8px',
                    }}
                  >
                    {lang === 'ua'
                      ? 'Індивідуальний пошив без обміну і повернення з мінімальною передоплатою в 50%'
                      : 'Custom tailoring without exchange or return with a minimum 50% prepayment'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 4. Підошва: */}
          {soleColors.length > 0 && (
            <div>
              <div style={labelStyle}>
                {lang === 'ua' ? 'Підошва:' : 'Sole:'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {soleColors.map((sc) => {
                    const isSelected = chosenSoleColorObj?.id === sc.id;
                    const label = sc.name?.[lang] || sc.name?.ua || sc.name || '';
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setSelectedSoleColorId(sc.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '7px 12px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: isSelected ? '1.5px solid #8cbff0' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#eef6ff' : '#fff',
                          color: '#1e293b',
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            backgroundColor: sc.hex || '#e2e8f0',
                            backgroundImage: sc.image ? `url(${sc.image})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid rgba(0,0,0,0.2)',
                            flexShrink: 0,
                          }}
                        />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {chosenSolePreviewImage && (
                  <div>
                    <img
                      src={chosenSolePreviewImage}
                      alt={sole?.name || ''}
                      style={{
                        width: '76px',
                        height: '56px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Розмір: + сантиметри по устілці + Розмірна сітка: */}
          <div>
            <div style={labelStyle}>
              {lang === 'ua' ? 'Розмір:' : 'Size:'}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {sizesList.map((szObj) => {
                const isSelected = selectedSize === szObj.value && !szObj.isBlocked;
                return (
                  <button
                    key={szObj.value}
                    type="button"
                    disabled={szObj.isBlocked}
                    onClick={() => setSelectedSize(szObj.value)}
                    style={{
                      minWidth: '44px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: isSelected ? '1.5px solid #8cbff0' : '1px solid #cbd5e1',
                      backgroundColor: szObj.isBlocked
                        ? '#fee2e2'
                        : isSelected
                        ? '#8cbff0'
                        : '#fff',
                      color: szObj.isBlocked
                        ? '#b91c1c'
                        : isSelected
                        ? '#fbf3d1'
                        : '#1e293b',
                      textDecoration: szObj.isBlocked ? 'line-through' : 'none',
                      cursor: szObj.isBlocked ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {szObj.value}
                  </button>
                );
              })}
            </div>

            {selectedSize && chosenInsoleCm != null && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                {lang === 'ua'
                  ? `${chosenInsoleCm} см по устілці`
                  : `${chosenInsoleCm} cm insole`}
              </div>
            )}

            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setIsSizeChartOpen((prev) => !prev)}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#334155',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {lang === 'ua' ? 'Розмірна сітка:' : 'Size chart:'}
              </button>

              {isSizeChartOpen && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: '6px',
                  }}
                >
                  {sizesList.map((szObj) => (
                    <div
                      key={szObj.value}
                      style={{
                        fontSize: '12px',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        color: szObj.isBlocked ? '#94a3b8' : '#1e293b',
                      }}
                    >
                      <strong>{szObj.value}</strong> —{' '}
                      {szObj.insoleCm != null
                        ? `${szObj.insoleCm} ${lang === 'ua' ? 'см' : 'cm'}`
                        : '—'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Додати в кошик */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '6px' }}>
            <button
              type="button"
              disabled={!canAddToCart}
              onClick={handleAddToCart}
              style={{
                flex: '1 1 200px',
                padding: '12px 20px',
                borderRadius: '12px',
                backgroundColor: canAddToCart ? '#8cbff0' : '#cbd5e1',
                color: '#fbf3d1',
                fontWeight: 700,
                fontSize: '14px',
                cursor: canAddToCart ? 'pointer' : 'not-allowed',
              }}
            >
              {lang === 'ua' ? 'Додати в кошик' : 'Add to cart'}
            </button>

            {addedNotice && (
              <button
                type="button"
                onClick={() => navigate('/cart')}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid #8cbff0',
                  backgroundColor: '#eef6ff',
                  color: '#1e3a5f',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {lang === 'ua' ? 'Перейти в кошик →' : 'Go to cart →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}