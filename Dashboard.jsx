import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid,
} from 'recharts';
import { api } from '../api';
import { money, fmtDate, currentYM, splitYM, CHART_COLORS } from '../utils';
import MonthPicker from '../components/MonthPicker.jsx';
import Progress from '../components/Progress.jsx';

export default function Dashboard() {
  const [ym, setYm] = useState(currentYM());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const { month, year } = splitYM(ym);
    setError('');
    api(`/dashboard?month=${month}&year=${year}`).then(setData).catch((e) => setError(e.message));
  }, [ym]);

  if (error) return <p className="alert alert-error">{error}</p>;
  if (!data) return <p className="page-loading">Loading dashboard…</p>;

  const t = data.totals;
  const spentPct = t.income > 0 ? Math.min((t.expense / t.income) * 100, 100) : t.expense > 0 ? 100 : 0;

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <MonthPicker value={ym} onChange={setYm} />
      </div>

      <section className="hero">
        <div>
          <p className="hero-label">Saved this month</p>
          <p className={`hero-num ${t.savings < 0 ? 'neg' : ''}`}>{money(t.savings)}</p>
          <p className="muted">
            {t.income > 0 ? `${t.savingsRate}% of your income` : 'Add income to see your savings rate.'}
          </p>
        </div>
        <div className="hero-split">
          <div className="split-bar"><span style={{ width: `${spentPct}%` }} /></div>
          <div className="split-legend">
            <span><i className="dot dot-income" /> Income {money(t.income)}</span>
            <span><i className="dot dot-expense" /> Spent {money(t.expense)}</span>
          </div>
        </div>
      </section>

      {data.alerts.length > 0 && (
        <section className="stack">
          {data.alerts.map((a) => (
            <p key={a.category} className={`alert ${a.status === 'EXCEEDED' ? 'alert-error' : 'alert-warn'}`}>
              {a.message}
            </p>
          ))}
        </section>
      )}

      <div className="grid-2">
        <section className="panel">
          <h2>Spending by category</h2>
          {data.categorySpending.length === 0 ? (
            <p className="empty">No expenses this month. Add one in Transactions.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.categorySpending} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {data.categorySpending.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="panel">
          <h2>Income vs expenses, last 6 months</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#2f9e6b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#d14b5a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2>Recent transactions</h2>
          {data.recent.length === 0 ? (
            <p className="empty">Nothing recorded for this month yet.</p>
          ) : (
            <ul className="list">
              {data.recent.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.category}</strong>
                    <span className="muted"> {r.description || r.source || ''}</span>
                    <div className="muted small">{fmtDate(r.date)}</div>
                  </div>
                  <span className={r.type === 'INCOME' ? 'pos' : 'neg'}>
                    {r.type === 'INCOME' ? '+' : '−'}{money(r.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>Savings goals</h2>
          {data.goals.length === 0 ? (
            <p className="empty">No goals yet. Create one in Savings goals.</p>
          ) : (
            data.goals.map((g) => (
              <div key={g.id} className="goal-mini">
                <div className="row-between">
                  <strong>{g.title}</strong>
                  <span className="muted">{g.percent}%</span>
                </div>
                <Progress percent={g.percent} status={g.completed ? 'OK' : g.overdue ? 'EXCEEDED' : 'OK'} />
                <p className="muted small">
                  {g.completed ? 'Goal reached' : `Save ${money(g.requiredMonthly)} per month`}
                </p>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}
