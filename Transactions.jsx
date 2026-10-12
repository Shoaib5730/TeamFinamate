import { useEffect, useState } from 'react';
import { api } from '../api';
import { money, fmtDate, dateStr, todayStr, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils';

const emptyForm = () => ({
  type: 'EXPENSE', amount: '', category: EXPENSE_CATEGORIES[0], source: '', description: '', date: todayStr(),
});
const emptyFilters = { type: '', category: '', search: '', from: '', to: '', sort: 'date_desc' };
const allCategories = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      api(`/transactions?${params}`).then(setItems).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, tick]);

  const categories = form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const changeType = (type) =>
    setForm({ ...form, type, category: (type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0] });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(editingId ? `/transactions/${editingId}` : '/transactions', {
        method: editingId ? 'PUT' : 'POST',
        body: form,
      });
      setForm(emptyForm());
      setEditingId(null);
      setTick((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({
      type: t.type, amount: t.amount, category: t.category,
      source: t.source || '', description: t.description || '', date: dateStr(t.date),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api(`/transactions/${id}`, { method: 'DELETE' });
      setTick((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const setFilter = (k, v) => setFilters({ ...filters, [k]: v });

  return (
    <>
      <div className="page-head"><h1>Transactions</h1></div>
      {error && <p className="alert alert-error">{error}</p>}

      <form className="panel form-grid" onSubmit={submit}>
        <h2 className="span-all">{editingId ? 'Edit transaction' : 'Add a transaction'}</h2>
        <label>Type
          <select value={form.type} onChange={(e) => changeType(e.target.value)}>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </label>
        <label>Amount (৳)
          <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </label>
        <label>Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Date
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        {form.type === 'INCOME' && (
          <label>Source
            <input placeholder="e.g. Company name, client" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          </label>
        )}
        <label className={form.type === 'INCOME' ? '' : 'span-2'}>Description
          <input placeholder="Optional note" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div className="span-all btn-row">
          <button className="btn">{editingId ? 'Save changes' : 'Add transaction'}</button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(emptyForm()); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="panel">
        <div className="filters">
          <input placeholder="Search description, source, category" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
          <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {allCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="date" aria-label="From date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} />
          <input type="date" aria-label="To date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} />
          <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="amount_desc">Highest amount</option>
            <option value="amount_asc">Lowest amount</option>
          </select>
          <button className="btn btn-ghost" onClick={() => setFilters(emptyFilters)}>Clear filters</button>
        </div>

        {items.length === 0 ? (
          <p className="empty">No transactions match. Add one above or clear the filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Category</th><th>Details</th><th className="right">Amount</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id}>
                    <td>{fmtDate(t.date)}</td>
                    <td>{t.category}</td>
                    <td className="muted">{[t.source, t.description].filter(Boolean).join(' · ') || '—'}</td>
                    <td className={`right ${t.type === 'INCOME' ? 'pos' : 'neg'}`}>
                      {t.type === 'INCOME' ? '+' : '−'}{money(t.amount)}
                    </td>
                    <td className="right nowrap">
                      <button className="link-btn" onClick={() => startEdit(t)}>Edit</button>
                      <button className="link-btn danger" onClick={() => remove(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
