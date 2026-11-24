import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section style={{ padding: '24px 16px' }}>
      <h1>Головна сторінка</h1>
      <p>Анатомічне взуття з натуральних матеріалів.</p>
      <Link to="/catalog">Перейти до каталогу →</Link>
    </section>
  );
}