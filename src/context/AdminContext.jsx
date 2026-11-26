import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

const DEFAULT_ADMIN_PIN = '4747';
const PIN_STORAGE_KEY = 'dim47_admin_pin';
const HINT_STORAGE_KEY = 'dim47_admin_recovery_hint';

const DEFAULT_SOLE_COLORS = [
  { id: 'sc_black', name: { ua: 'Чорна підошва', en: 'Black sole' }, hex: '#1a1a1a' },
  { id: 'sc_milk', name: { ua: 'Молочна підошва', en: 'Milk sole' }, hex: '#f4efe6' },
  { id: 'sc_white', name: { ua: 'Біла підошва', en: 'White sole' }, hex: '#ffffff' },
  { id: 'sc_caramel', name: { ua: 'Карамель підошва', en: 'Caramel sole' }, hex: '#b5651d' },
];

const defaultManufacturers = {
  m1: {
    id: 'm1',
    name: 'Виробник 1 (Міла)',
    soles: [
      {
        id: 'sole_m1_1',
        name: 'Тракторна підошва (36–43)',
        sizes: [36, 37, 38, 39, 40, 41, 42, 43],
        blockedSizes: [],
        image: '',
        colors: DEFAULT_SOLE_COLORS,
      },
      {
        id: 'sole_m1_2',
        name: 'Підошва Лофери (36–41)',
        sizes: [36, 37, 38, 39, 40, 41],
        blockedSizes: [],
        image: '',
        colors: DEFAULT_SOLE_COLORS,
      },
    ],
    palettes: {
      leather: [
        { id: 'l1', name: { ua: 'Чорна шкіра', en: 'Black leather' }, hex: '#1a1a1a', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 'l2', name: { ua: 'Молочна шкіра', en: 'Milk leather' }, hex: '#f5f0e6', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 'l3', name: { ua: 'Карамель шкіра', en: 'Caramel leather' }, hex: '#b5651d', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 'l_extra1', name: { ua: 'Металік бронза', en: 'Bronze metallic' }, hex: '#8c6239', isBasic: false, isNonReturnable: true, isBlocked: false },
        { id: 'l_extra2', name: { ua: 'Фуксія шкіра', en: 'Fuchsia leather' }, hex: '#d63384', isBasic: false, isNonReturnable: true, isBlocked: false },
      ],
      suede: [
        { id: 's1', name: { ua: 'Чорна замша', en: 'Black suede' }, hex: '#262626', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 's2', name: { ua: 'Бежева замша', en: 'Beige suede' }, hex: '#d8c3a5', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 's3', name: { ua: 'Шоколадна замша', en: 'Chocolate suede' }, hex: '#4a2c18', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 's_extra1', name: { ua: 'Смарагд замша', en: 'Emerald suede' }, hex: '#196f3d', isBasic: false, isNonReturnable: true, isBlocked: false },
      ],
    },
  },
  m2: {
    id: 'm2',
    name: 'Виробник 2 (Валєра)',
    soles: [
      {
        id: 'sole_m2_1',
        name: 'Підошва Черевики (36–43)',
        sizes: [36, 37, 38, 39, 40, 41, 42, 43],
        blockedSizes: [],
        image: '',
        colors: DEFAULT_SOLE_COLORS,
      },
      {
        id: 'sole_m2_2',
        name: 'Підошва Босоніжки (36–41)',
        sizes: [36, 37, 38, 39, 40, 41],
        blockedSizes: [],
        image: '',
        colors: DEFAULT_SOLE_COLORS,
      },
    ],
    palettes: {
      leather: [
        { id: 'l4', name: { ua: 'Чорна шкіра', en: 'Black leather' }, hex: '#141414', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 'l5', name: { ua: 'Оливкова шкіра', en: 'Olive leather' }, hex: '#556b2f', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 'l_extra3', name: { ua: 'Бордо шкіра', en: 'Burgundy leather' }, hex: '#6d1b2b', isBasic: false, isNonReturnable: true, isBlocked: false },
      ],
      suede: [
        { id: 's4', name: { ua: 'Сіра замша', en: 'Grey suede' }, hex: '#8e8e93', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 's5', name: { ua: 'Пудрова замша', en: 'Powder suede' }, hex: '#e6c7c2', isBasic: true, isNonReturnable: false, isBlocked: false },
        { id: 's_extra2', name: { ua: 'Лаванда замша', en: 'Lavender suede' }, hex: '#9b8ec4', isBasic: false, isNonReturnable: true, isBlocked: false },
      ],
    },
  },
};

const defaultHeroData = {
  slides: [],
  title: {
    ua: 'Нова колекція DiM47',
    en: 'New DiM47 Collection',
  },
  subtitle: {
    ua: 'Анатомічне взуття ручної роботи з натуральної шкіри та замші',
    en: 'Handcrafted anatomical footwear made of genuine leather and suede',
  },
};

const normalizeManufacturers = (parsed) => {
  const result = {};
  for (const mfrId of ['m1', 'm2']) {
    const baseMfr = defaultManufacturers[mfrId];
    const savedMfr = parsed?.[mfrId] || {};
    const rawSoles = Array.isArray(savedMfr.soles) && savedMfr.soles.length
      ? savedMfr.soles
      : baseMfr.soles;

    const normalizedSoles = rawSoles.map((sole, idx) => ({
      ...sole,
      id: sole.id || `${baseMfr.soles[idx]?.id || `sole_${mfrId}_${idx}`}`,
      name: sole.name || 'Підошва',
      sizes: Array.isArray(sole.sizes) && sole.sizes.length ? sole.sizes : [36, 37, 38, 39, 40],
      blockedSizes: Array.isArray(sole.blockedSizes) ? sole.blockedSizes : [],
      image: typeof sole.image === 'string' ? sole.image : '',
      colors: Array.isArray(sole.colors) && sole.colors.length ? sole.colors : DEFAULT_SOLE_COLORS,
    }));

    result[mfrId] = {
      ...baseMfr,
      ...savedMfr,
      id: mfrId,
      name: savedMfr.name || baseMfr.name,
      soles: normalizedSoles,
      palettes: {
        leather: Array.isArray(savedMfr.palettes?.leather)
          ? savedMfr.palettes.leather
          : baseMfr.palettes.leather,
        suede: Array.isArray(savedMfr.palettes?.suede)
          ? savedMfr.palettes.suede
          : baseMfr.palettes.suede,
      },
    };
  }
  return result;
};

const safeSetStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`Failed to save "${key}" to localStorage:`, err);
    return false;
  }
};

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('dim47_is_admin') === 'true';
  });

  const [adminPin, setAdminPin] = useState(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_ADMIN_PIN;
  });

  const [recoveryHint, setRecoveryHint] = useState(() => {
    return localStorage.getItem(HINT_STORAGE_KEY) || '';
  });

  const [manufacturers, setManufacturers] = useState(() => {
    try {
      const saved = localStorage.getItem('dim47_manufacturers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.m1 || parsed?.m2) {
          return normalizeManufacturers(parsed);
        }
      }
    } catch {
      localStorage.removeItem('dim47_manufacturers');
    }
    return defaultManufacturers;
  });

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('dim47_products');
      if (saved) return JSON.parse(saved);
    } catch {
      localStorage.removeItem('dim47_products');
    }
    return [];
  });

  const [heroData, setHeroData] = useState(() => {
    try {
      const savedHero = localStorage.getItem('dim47_hero_data');
      if (savedHero) {
        const parsed = JSON.parse(savedHero);
        if (parsed && typeof parsed === 'object') {
          return {
            slides: Array.isArray(parsed.slides) ? parsed.slides : [],
            title: {
              ua: parsed.title?.ua ?? defaultHeroData.title.ua,
              en: parsed.title?.en ?? defaultHeroData.title.en,
            },
            subtitle: {
              ua: parsed.subtitle?.ua ?? defaultHeroData.subtitle.ua,
              en: parsed.subtitle?.en ?? defaultHeroData.subtitle.en,
            },
          };
        }
      }
    } catch {
      localStorage.removeItem('dim47_hero_data');
    }
    return defaultHeroData;
  });

  useEffect(() => {
    safeSetStorage('dim47_is_admin', String(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    safeSetStorage(PIN_STORAGE_KEY, adminPin);
  }, [adminPin]);

  useEffect(() => {
    safeSetStorage(HINT_STORAGE_KEY, recoveryHint);
  }, [recoveryHint]);

  useEffect(() => {
    safeSetStorage('dim47_manufacturers', JSON.stringify(manufacturers));
  }, [manufacturers]);

  useEffect(() => {
    safeSetStorage('dim47_products', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    safeSetStorage('dim47_hero_data', JSON.stringify(heroData));
    const legacyBanner = {
      image: heroData.slides?.[0] || '',
      title: heroData.title,
      subtitle: heroData.subtitle,
    };
    safeSetStorage('dim47_banner', JSON.stringify(legacyBanner));
  }, [heroData]);

  const login = (inputPin) => {
    const cleaned = String(inputPin || '').trim();
    if (cleaned === adminPin || cleaned === DEFAULT_ADMIN_PIN) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => setIsAdmin(false);

  const changeAdminPin = (newPin, newHint = '') => {
    const cleaned = String(newPin || '').trim();
    if (!cleaned) return false;
    setAdminPin(cleaned);
    setRecoveryHint(String(newHint || '').trim());
    return true;
  };

  const resetAdminPin = (customNewPin = DEFAULT_ADMIN_PIN) => {
    const cleaned = String(customNewPin || '').trim() || DEFAULT_ADMIN_PIN;
    setAdminPin(cleaned);
    setIsAdmin(true);
    return cleaned;
  };

  const addProduct = (newProduct) => {
    const mfr = manufacturers[newProduct.manufacturerId] || manufacturers.m1;
    const sole = mfr.soles?.find((s) => s.id === newProduct.soleId) || mfr.soles?.[0];
    setItems((prev) => [
      {
        ...newProduct,
        id: Date.now().toString(),
        soleId: sole?.id || '',
        sizes: newProduct.sizes?.length ? newProduct.sizes : sole?.sizes || [36, 37, 38, 39, 40],
        gallery: newProduct.gallery?.length ? newProduct.gallery : newProduct.image ? [newProduct.image] : [],
        availableMaterials: newProduct.availableMaterials || ['leather', 'suede'],
        availableLinings: newProduct.availableLinings || ['fleece', 'fur'],
        allowColorCombo: Boolean(newProduct.allowColorCombo),
        comboZoneLabel: newProduct.comboZoneLabel || 'Вставка / задник',
        isBlocked: false,
        blockedSizes: [],
        blockedColorIds: [],
      },
      ...prev,
    ]);
  };

  const updateProduct = (id, updatedFields) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );
  };

  const deleteProduct = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleInStock = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, inStock: !item.inStock } : item
      )
    );
  };

  const toggleBlockProduct = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBlocked: !item.isBlocked } : item
      )
    );
  };

  const toggleBlockSize = (productId, size) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;
        const blocked = item.blockedSizes || [];
        const exists = blocked.includes(size);
        return {
          ...item,
          blockedSizes: exists
            ? blocked.filter((s) => s !== size)
            : [...blocked, size],
        };
      })
    );
  };

  const toggleProductColorBlock = (productId, colorId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;
        const blocked = item.blockedColorIds || [];
        const exists = blocked.includes(colorId);
        return {
          ...item,
          blockedColorIds: exists
            ? blocked.filter((c) => c !== colorId)
            : [...blocked, colorId],
        };
      })
    );
  };

  const addManufacturerSole = (mfrId, name, sizes, extra = {}) => {
    const newSole = {
      id: `sole_${Date.now()}`,
      name,
      sizes,
      blockedSizes: [],
      image: extra.image || '',
      colors: extra.colors?.length ? extra.colors : DEFAULT_SOLE_COLORS,
    };
    setManufacturers((prev) => ({
      ...prev,
      [mfrId]: {
        ...prev[mfrId],
        soles: [...(prev[mfrId]?.soles || []), newSole],
      },
    }));
  };

  const updateManufacturerSole = (mfrId, soleId, updatedFields) => {
    setManufacturers((prev) => ({
      ...prev,
      [mfrId]: {
        ...prev[mfrId],
        soles: (prev[mfrId]?.soles || []).map((s) =>
          s.id === soleId ? { ...s, ...updatedFields } : s
        ),
      },
    }));
  };

  const toggleSoleBlockedSize = (mfrId, soleId, size) => {
    setManufacturers((prev) => ({
      ...prev,
      [mfrId]: {
        ...prev[mfrId],
        soles: (prev[mfrId]?.soles || []).map((s) => {
          if (s.id !== soleId) return s;
          const blocked = s.blockedSizes || [];
          return {
            ...s,
            blockedSizes: blocked.includes(size)
              ? blocked.filter((x) => x !== size)
              : [...blocked, size],
          };
        }),
      },
    }));
  };

  const deleteManufacturerSole = (mfrId, soleId) => {
    setManufacturers((prev) => {
      const remaining = (prev[mfrId]?.soles || []).filter((s) => s.id !== soleId);
      if (!remaining.length) return prev;
      return {
        ...prev,
        [mfrId]: {
          ...prev[mfrId],
          soles: remaining,
        },
      };
    });
  };

  const addManufacturerColor = (mfrId, materialType, colorObj) => {
    setManufacturers((prev) => {
      const mfr = prev[mfrId];
      if (!mfr) return prev;
      const currentList = mfr.palettes?.[materialType] || [];
      return {
        ...prev,
        [mfrId]: {
          ...mfr,
          palettes: {
            ...mfr.palettes,
            [materialType]: [
              ...currentList,
              {
                ...colorObj,
                id: `${materialType}_${Date.now()}`,
                isBasic: Boolean(colorObj.isBasic),
                isNonReturnable: Boolean(colorObj.isNonReturnable),
                isBlocked: false,
              },
            ],
          },
        },
      };
    });
  };

  const toggleManufacturerColorFlag = (mfrId, materialType, colorId, field) => {
    setManufacturers((prev) => {
      const mfr = prev[mfrId];
      if (!mfr) return prev;
      return {
        ...prev,
        [mfrId]: {
          ...mfr,
          palettes: {
            ...mfr.palettes,
            [materialType]: (mfr.palettes?.[materialType] || []).map((c) =>
              c.id === colorId ? { ...c, [field]: !c[field] } : c
            ),
          },
        },
      };
    });
  };

  const deleteManufacturerColor = (mfrId, materialType, colorId) => {
    setManufacturers((prev) => {
      const mfr = prev[mfrId];
      if (!mfr) return prev;
      return {
        ...prev,
        [mfrId]: {
          ...mfr,
          palettes: {
            ...mfr.palettes,
            [materialType]: (mfr.palettes?.[materialType] || []).filter(
              (c) => c.id !== colorId
            ),
          },
        },
      };
    });
  };

  const addHeroSlides = (newSlides) => {
    const validSlides = Array.isArray(newSlides) ? newSlides.filter(Boolean) : [];
    if (!validSlides.length) return;
    setHeroData((prev) => ({
      ...prev,
      slides: [...(prev.slides || []), ...validSlides],
    }));
  };

  const removeHeroSlide = (indexToRemove) => {
    setHeroData((prev) => {
      const current = prev.slides || [];
      return {
        ...prev,
        slides: current.filter((_, idx) => idx !== indexToRemove),
      };
    });
  };

  const updateHeroTexts = ({ title, subtitle }) => {
    setHeroData((prev) => ({
      ...prev,
      title: {
        ua: title?.ua ?? prev.title?.ua ?? '',
        en: title?.en ?? prev.title?.en ?? '',
      },
      subtitle: {
        ua: subtitle?.ua ?? prev.subtitle?.ua ?? '',
        en: subtitle?.en ?? prev.subtitle?.en ?? '',
      },
    }));
  };

  const updateBanner = (newBannerData) => {
    setHeroData((prev) => ({
      ...prev,
      slides: newBannerData.image
        ? [newBannerData.image, ...(prev.slides || []).slice(1)]
        : prev.slides,
      title: newBannerData.title ? { ...prev.title, ...newBannerData.title } : prev.title,
      subtitle: newBannerData.subtitle
        ? { ...prev.subtitle, ...newBannerData.subtitle }
        : prev.subtitle,
    }));
  };

  const banner = {
    image: heroData.slides?.[0] || '',
    title: heroData.title,
    subtitle: heroData.subtitle,
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        login,
        logout,
        adminPin,
        recoveryHint,
        changeAdminPin,
        resetAdminPin,
        defaultAdminPin: DEFAULT_ADMIN_PIN,
        manufacturers,
        addManufacturerSole,
        updateManufacturerSole,
        toggleSoleBlockedSize,
        deleteManufacturerSole,
        addManufacturerColor,
        toggleManufacturerColorFlag,
        deleteManufacturerColor,
        items,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleInStock,
        toggleBlockProduct,
        toggleBlockSize,
        toggleProductColorBlock,
        heroData,
        addHeroSlides,
        removeHeroSlide,
        updateHeroTexts,
        banner,
        updateBanner,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);