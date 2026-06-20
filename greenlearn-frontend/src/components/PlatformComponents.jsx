import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  pending: 'На проверке',
  ai_review: 'AI проверка',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  active: 'Активно',
  clean: 'Чисто',
  needs_attention: 'Нужна помощь',
  draft: 'Черновик',
};

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header platform-page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="platform-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon, value, label, tone = 'green' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function MetricCard({ label, value, note, tone = 'green' }) {
  return (
    <div className={`platform-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

export function InfoCard({ eyebrow, title, text, children, to }) {
  const body = (
    <div className="platform-card">
      {eyebrow && <span className="platform-eyebrow">{eyebrow}</span>}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
  return to ? <Link to={to} className="platform-card-link">{body}</Link> : body;
}

export function StatusBadge({ value }) {
  return <span className={`platform-status ${value}`}>{STATUS_LABELS[value] || value}</span>;
}

export function ProgressBar({ value }) {
  return (
    <div className="platform-progress">
      <div style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}

export function SimpleTable({ columns, rows }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{columns.map(col => <th key={col.key}>{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || row.name || row.title || index}>
                {columns.map(col => (
                  <td key={col.key}>{col.render ? col.render(row, index) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GpExplainer() {
  return (
    <div className="platform-note">
      <strong>GreenPoints — это не деньги.</strong>
      <span> Это внутренняя мотивационная валюта: родители, школы и ВУЗы покупают пакеты, а дети и студенты получают баллы только за реальные полезные действия.</span>
    </div>
  );
}

export function MockApiNotice() {
  return (
    <div className="platform-note soft">
      <strong>Демо-режим.</strong>
      <span> Данные на этой странице подготовлены как frontend mock, структура готова для подключения к backend API.</span>
    </div>
  );
}
