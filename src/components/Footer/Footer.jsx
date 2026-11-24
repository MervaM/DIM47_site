export default function Footer() {
  return (
    <footer style={{ padding: '24px 16px', borderTop: '1px solid #eee', marginTop: 'auto', textAlign: 'center', fontSize: '14px', color: '#666' }}>
      © {new Date().getFullYear()} DIM47. Усі права захищено.
    </footer>
  );
}