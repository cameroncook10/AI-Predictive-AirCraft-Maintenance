import { useState } from 'react';

export default function ManualViewer({ manuals }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  if (!manuals || manuals.length === 0) {
    return <div className="empty-state">No maintenance manuals available</div>;
  }

  const filtered = manuals.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.chapter.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.system.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fade-in">
      <div className="manual-search">
        <input
          className="manual-search-input"
          type="text"
          placeholder="Search manuals by chapter, title, or system..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="manual-list">
        {filtered.map((manual, idx) => (
          <div
            key={idx}
            className={`manual-card${expanded === idx ? ' expanded' : ''}`}
            onClick={() => setExpanded(expanded === idx ? null : idx)}
          >
            <div className="manual-header">
              <span className="manual-chapter">{manual.chapter}</span>
              <span className="manual-system">{manual.system}</span>
            </div>
            <div className="manual-title">{manual.title}</div>
            <div className="manual-desc">{manual.description}</div>
            <div className="manual-procedures">
              <div className="manual-proc-title">Ground Procedures</div>
              {manual.procedures.map((proc, pi) => (
                <div className="manual-proc-item" key={pi}>{proc}</div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">No manuals matching "{search}"</div>
        )}
      </div>
    </div>
  );
}
