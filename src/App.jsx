import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AdminProvider } from './context/AdminContext';
import { CartProvider } from './context/CartContext';
import AdminBar from './components/AdminBar/AdminBar';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ScrollToTopButton from './components/ScrollToTopButton/ScrollToTopButton';
import Home from './pages/Home/Home';
import Catalog from './pages/Catalog/Catalog';
import Product from './pages/Product/Product';
import Cart from './pages/Cart/Cart';
import Constructor from './pages/Constructor/Constructor';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import Vault from './pages/Vault/Vault';

function App() {
  return (
    <AdminProvider>
      <LanguageProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="app-wrapper">
              <AdminBar />
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:id" element={<Product />} />
                  <Route path="/constructor" element={<Constructor />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/vault" element={<Vault />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
              <ScrollToTopButton />
            </div>
          </BrowserRouter>
        </CartProvider>
      </LanguageProvider>
    </AdminProvider>
  );
}

export default App;