import './SkeletonLoader.css';

export default function SkeletonLoader({ count = 1 }) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
      {skeletons.map(i => (
        <div key={i} className="card skeleton-card">
          <div className="skeleton skeleton-img"></div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
