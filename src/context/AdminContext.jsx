import { createContext, useContext, useState, useEffect } from 'react';
import { products as initialProducts } from '../data/products';

const AdminContext = createContext();

const ADMIN_PIN = '4747';

const defaultManufacturers = {
  m1: {
    id: 'm1',
    name: 'Виробник 1 (Міла)',
    soles: [
      { id: 'sole_m1_1', name: 'Тракторна підошва (36–43)', sizes: [36, 37, 38, 39, 40, 41, 42, 43], blockedSizes: [] },
      { id: 'sole_m1_2', name: 'Підошва Лофери (36–41)', sizes: [36, 37, 38, 39, 40, 41], blockedSizes: [] },
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
      { id: 'sole_m2_1', name: 'Підошва Черевики (36–43)', sizes: [36, 37, 38, 39, 40, 41, 42, 43], blockedSizes: [] },
      { id: 'sole_m2_2', name: 'Підошва Босоніжки (36–41)', sizes: [36, 37, 38, 39, 40, 41], blockedSizes: [] },
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
  slides: [
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1400&q=80',
  ],
  title: {
    ua: 'Нова колекція DiM47',
    en: 'New DiM47 Collection',
  },
  subtitle: {
    ua: 'Анатомічне взуття ручної роботи з натуральної шкіри та замші',
    en: 'Handcrafted anatomical footwear made of genuine leather and suede',
  },
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

  const [manufacturers, setManufacturers] = useState(() => {
    try {
      const saved = localStorage.getItem('dim47_manufacturers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.m1?.soles && parsed?.m2?.soles) return parsed;
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
    return initialProducts.map((p) => ({
      ...p,
      manufacturerId: 'm1',
      soleId: 'sole_m1_1',
      gallery: p.gallery || [p.image],
      availableMaterials: ['leather', 'suede'],
      availableLinings: ['fleece', 'fur'],
      isBlocked: false,
      blockedSizes: [],
      blockedColorIds: [],
    }));
  });

  const [heroData, setHeroData] = useState(() => {
    try {
      const savedHero = localStorage.getItem('dim47_hero_data');
      if (savedHero) {
        const parsed = JSON.parse(savedHero);
        if (parsed && typeof parsed === 'object') {
          return {
            slides: Array.isArray(parsed.slides) ? parsed.slides : defaultHeroData.slides,
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

      const savedLegacyBanner = localStorage.getItem('dim47_banner');
      if (savedLegacyBanner) {
        const legacy = JSON.parse(savedLegacyBanner);
        return {
          slides: legacy?.image ? [legacy.image] : defaultHeroData.slides,
          title: {
            ua: legacy?.title?.ua ?? defaultHeroData.title.ua,
            en: legacy?.title?.en ?? defaultHeroData.title.en,
          },
          subtitle: {
            ua: legacy?.subtitle?.ua ?? defaultHeroData.subtitle.ua,
            en: legacy?.subtitle?.en ?? defaultHeroData.subtitle.en,
          },
        };
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

  const login = (pin) => {
    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => setIsAdmin(false);

  const addProduct = (newProduct) => {
    const mfr = manufacturers[newProduct.manufacturerId] || manufacturers.m1;
    const sole = mfr.soles?.find((s) => s.id === newProduct.soleId) || mfr.soles?.[0];
    setItems((prev) => [
      {
        ...newProduct,
        id: Date.now().toString(),
        soleId: sole?.id || '',
        sizes: newProduct.sizes?.length ? newProduct.sizes : sole?.sizes || [36, 37, 38, 39, 40],
        gallery: newProduct.gallery?.length ? newProduct.gallery : [newProduct.image],
        availableMaterials: newProduct.availableMaterials || ['leather', 'suede'],
        availableLinings: newProduct.availableLinings || ['fleece', 'fur'],
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

  const addManufacturerSole = (mfrId, name, sizes) => {
    const newSole = {
      id: `sole_${Date.now()}`,
      name,
      sizes,
      blockedSizes: [],
    };
    setManufacturers((prev) => ({
      ...prev,
      [mfrId]: {
        ...prev[mfrId],
        soles: [...(prev[mfrId].soles || []), newSole],
      },
    }));
  };

  const updateManufacturerSole = (mfrId, soleId, updatedFields) => {
    setManufacturers((prev) => ({
      ...prev,
      [mfrId]: {
        ...prev[mfrId],
        soles: prev[mfrId].soles.map((s) =>
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
        soles: prev[mfrId].soles.map((s) => {
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
      const remaining = prev[mfrId].soles.filter((s) => s.id !== soleId);
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
      const currentList = mfr.palettes[materialType] || [];
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
      return {
        ...prev,
        [mfrId]: {
          ...mfr,
          palettes: {
            ...mfr.palettes,
            [materialType]: mfr.palettes[materialType].map((c) =>
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
      return {
        ...prev,
        [mfrId]: {
          ...mfr,
          palettes: {
            ...mfr.palettes,
            [materialType]: mfr.palettes[materialType].filter((c) => c.id !== colorId),
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
      if (current.length <= 1) return prev;
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