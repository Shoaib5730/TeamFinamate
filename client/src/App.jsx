import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";

const API_URL = "http://localhost:5000";

const money = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(value);

const today = () => new Date().toISOString().slice(0, 10);

const initialTransactions = [
  {
    id: "demo-1",
    type: "INCOME",
    title: "Monthly Salary",
    category: "Salary",
    amount: 25000,
    date: today(),
    description: "Demo transaction",
  },
  {
    id: "demo-2",
    type: "EXPENSE",
    title: "Groceries",
    category: "Food",
    amount: 1800,
    date: today(),
    description: "Demo transaction",
  },
];

function readTransactions() {
  try {
    const saved = localStorage.getItem("finmate_transactions");
    return saved ? JSON.parse(saved) : initialTransactions;
  } catch {
    return initialTransactions;
  }
}

function App() {
  // ------------------ ১. সব State এবং Hooks সবার উপরে ------------------
  const [transactions, setTransactions] = useState(readTransactions);
  const [page, setPage] = useState("Dashboard");

  const [authPage, setAuthPage] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("EXPENSE");
  const [notice, setNotice] = useState("");

  const [backendStatus, setBackendStatus] = useState("Checking backend...");

  const [form, setForm] = useState({
    title: "",
    category: "Food",
    amount: "",
    date: today(),
    description: "",
  });

  // Backend connection check
  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setBackendStatus(data.message);
      })
      .catch((err) => {
        console.error("Backend error:", err);
        setBackendStatus("Backend connection failed");
      });
  }, []);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(
      "finmate_transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  // Filter calculation using useMemo (সব Hooks-এর সাথেই থাকবে)
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((item) => {
        const matchesSearch = [
          item.title,
          item.category,
          item.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

        const matchesType =
          filterType === "ALL" || item.type === filterType;

        const matchesMonth =
          !filterMonth || item.date.startsWith(filterMonth);

        return matchesSearch && matchesType && matchesMonth;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, search, filterType, filterMonth]);

  // ------------------ ২. Helper Functions ------------------
  const income = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expenses = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const balance = income - expenses;

  function openAdd(type) {
    setFormType(type);
    setEditingId(null);
    setForm({
      title: "",
      category: type === "INCOME" ? "Salary" : "Food",
      amount: "",
      date: today(),
      description: "",
    });
    setShowForm(true);
    setNotice("");
  }

  function openEdit(item) {
    setEditingId(item.id);
    setFormType(item.type);
    setForm({
      title: item.title,
      category: item.category,
      amount: String(item.amount),
      date: item.date,
      description: item.description || "",
    });
    setShowForm(true);
    setNotice("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || Number(form.amount) <= 0) {
      setNotice("Please enter a title and a valid amount.");
      return;
    }

    const transaction = {
      id: editingId || crypto.randomUUID(),
      type: formType,
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      description: form.description.trim(),
    };

    if (editingId) {
      setTransactions((current) =>
        current.map((item) =>
          item.id === editingId ? transaction : item
        )
      );
      setNotice("Transaction updated successfully.");
    } else {
      setTransactions((current) => [transaction, ...current]);
      setNotice("Transaction added successfully.");
    }

    setShowForm(false);
    setEditingId(null);
    setPage(formType === "INCOME" ? "Income" : "Expenses");
  }

  function deleteTransaction(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    setTransactions((current) =>
      current.filter((item) => item.id !== id)
    );
    setNotice("Transaction deleted.");
  }

  function resetFilters() {
    setSearch("");
    setFilterType("ALL");
    setFilterMonth("");
  }

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  function changePage(nextPage) {
    setPage(nextPage);
    setNotice("");
    setShowForm(false);
  }

  function renderTransactionTable(items) {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">৳</div>
          <h3>No transactions found</h3>
          <p>Add a transaction or change your search filters.</p>
        </div>
      );
    }

    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Category</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="transaction-name">
                    <span
                      className={`transaction-icon ${item.type.toLowerCase()}`}
                    >
                      {item.type === "INCOME" ? "↙" : "↗"}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.description || item.type}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="category-tag">{item.category}</span>
                </td>
                <td>{item.date}</td>
                <td
                  className={
                    item.type === "INCOME" ? "income-text" : "expense-text"
                  }
                >
                  {item.type === "INCOME" ? "+" : "-"}
                  {money(item.amount)}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="icon-button"
                      title="Edit"
                      onClick={() => openEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="icon-button delete-button"
                      title="Delete"
                      onClick={() => deleteTransaction(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const pageTitle = {
    Dashboard: "Dashboard",
    Income: "Income Management",
    Expenses: "Expense Management",
    Transactions: "Transaction History",
  }[page];

  // ------------------ ৩. Conditional Auth Render (সব Hooks-এর নিচে) ------------------
  if (!isLoggedIn) {
    return (
      <div>
        <div style={{
          textAlign: "center",
          background: backendStatus.includes("failed") ? "#ffe6e6" : "#e6ffe6",
          color: backendStatus.includes("failed") ? "#d8000c" : "#270",
          padding: "10px",
          fontWeight: "bold",
          fontSize: "14px"
        }}>
          Backend Status: {backendStatus}
        </div>

        {authPage === "login" ? (
          <Login
            onSwitchToRegister={() => setAuthPage("register")}
            onLoginSuccess={() => setIsLoggedIn(true)}
          />
        ) : (
          <Register onSwitchToLogin={() => setAuthPage("login")} />
        )}
      </div>
    );
  }

  // ------------------ ৪. Main Dashboard UI Render ------------------
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <button className="brand" onClick={() => changePage("Dashboard")}>
          <span className="brand-mark">F</span>
          <span>finmate<span className="brand-dot">.</span></span>
        </button>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation">
          {[
            ["Dashboard", "▦"],
            ["Income", "↙"],
            ["Expenses", "↗"],
            ["Transactions", "☷"],
          ].map(([name, symbol]) => (
            <button
              key={name}
              onClick={() => changePage(name)}
              className={`nav-item ${page === name ? "selected" : ""}`}
            >
              <span className="nav-symbol">{symbol}</span>
              <span>{name}</span>
              {page === name && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-symbol">✦</div>
            <strong>Build better habits</strong>
            <p>Keep track of every taka you earn and spend.</p>
          </div>
          <div className="profile-row">
            <div className="avatar">S</div>
            <div>
              <strong>Demo User</strong>
              <small>Local account</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">FINMATE / {page.toUpperCase()}</div>
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-right">
            <span className="demo-badge">CONNECTED</span>
            <button 
              className="secondary-button"
              onClick={() => setIsLoggedIn(false)}
              style={{ marginLeft: "10px" }}
            >
              Logout
            </button>
          </div>
        </header>

        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {page === "Dashboard" && (
          <>
            <p>Backend Status: {backendStatus}</p>
            <section className="welcome-banner">
              <div>
                <span className="eyebrow">YOUR MONEY, YOUR CONTROL</span>
                <h2>Take control of your finances.</h2>
                <p>
                  A clear view of your money starts with a simple habit:
                  tracking it.
                </p>
                <button className="primary-button" onClick={() => openAdd("EXPENSE")}>
                  + Add a transaction
                </button>
              </div>
              <div className="banner-art" aria-hidden="true">
                <div className="art-circle">৳</div>
                <div className="art-card art-card-one">↗ Spending</div>
                <div className="art-card art-card-two">↙ Income</div>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card balance-card">
                <div className="stat-top">
                  <span>Total Balance</span>
                  <span className="stat-icon purple">৳</span>
                </div>
                <h2>{money(balance)}</h2>
                <p>Income minus expenses</p>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Income</span>
                  <span className="stat-icon green">↙</span>
                </div>
                <h2>{money(income)}</h2>
                <p className="muted">Money received</p>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Expenses</span>
                  <span className="stat-icon orange">↗</span>
                </div>
                <h2>{money(expenses)}</h2>
                <p className="muted">Money spent</p>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <span>Transactions</span>
                  <span className="stat-icon blue">☷</span>
                </div>
                <h2>{transactions.length}</h2>
                <p className="muted">Recorded activities</p>
              </div>
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div>
                  <h2>Recent Transactions</h2>
                  <p>Your latest income and expenses</p>
                </div>
                <button className="text-button" onClick={() => changePage("Transactions")}>
                  View all →
                </button>
              </div>
              {renderTransactionTable(recentTransactions)}
            </section>

            <section className="quick-actions">
              <button className="quick-card" onClick={() => openAdd("INCOME")}>
                <span className="quick-icon green">↙</span>
                <span><strong>Add income</strong><small>Record money received</small></span>
                <span className="quick-arrow">→</span>
              </button>
              <button className="quick-card" onClick={() => openAdd("EXPENSE")}>
                <span className="quick-icon orange">↗</span>
                <span><strong>Add expense</strong><small>Record money spent</small></span>
                <span className="quick-arrow">→</span>
              </button>
            </section>
          </>
        )}

        {(page === "Income" || page === "Expenses" || page === "Transactions") && (
          <section className="content-card management-card">
            <div className="section-heading management-heading">
              <div>
                <h2>
                  {page === "Income"
                    ? "All Income"
                    : page === "Expenses"
                    ? "All Expenses"
                    : "All Transactions"}
                </h2>
                <p>Search, filter, edit or delete your records.</p>
              </div>
              {page !== "Transactions" && (
                <button
                  className="primary-button"
                  onClick={() => openAdd(page === "Income" ? "INCOME" : "EXPENSE")}
                >
                  + Add {page === "Income" ? "Income" : "Expense"}
                </button>
              )}
            </div>

            <div className="filter-bar">
              <input
                type="search"
                placeholder="Search title, category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search transactions"
              />
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                aria-label="Filter by type"
              >
                <option value="ALL">All types</option>
                <option value="INCOME">Income only</option>
                <option value="EXPENSE">Expenses only</option>
              </select>
              <input
                type="month"
                value={filterMonth}
                onChange={(event) => setFilterMonth(event.target.value)}
                aria-label="Filter by month"
              />
              <button className="secondary-button" onClick={resetFilters}>
                Reset
              </button>
            </div>

            {renderTransactionTable(
              filteredTransactions.filter((item) => {
                if (page === "Income") return item.type === "INCOME";
                if (page === "Expenses") return item.type === "EXPENSE";
                return true;
              })
            )}
          </section>
        )}

        <footer className="footer">
          <span>© 2026 Finmate</span>
          <span>Smart Personal Finance Platform</span>
        </footer>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <section className="transaction-modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  {editingId ? "UPDATE RECORD" : "NEW RECORD"}
                </span>
                <h2>{editingId ? "Edit transaction" : "Add transaction"}</h2>
              </div>
              <button className="close-button" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>

            <div className="type-switch">
              <button
                className={formType === "INCOME" ? "type-active income-active" : ""}
                onClick={() => {
                  setFormType("INCOME");
                  setForm((current) => ({ ...current, category: "Salary" }));
                }}
                type="button"
              >
                ↙ Income
              </button>
              <button
                className={formType === "EXPENSE" ? "type-active expense-active" : ""}
                onClick={() => {
                  setFormType("EXPENSE");
                  setForm((current) => ({ ...current, category: "Food" }));
                }}
                type="button"
              >
                ↗ Expense
              </button>
            </div>

            <form onSubmit={handleSubmit} className="transaction-form">
              <label>
                Title
                <input
                  required
                  maxLength={100}
                  placeholder="e.g. Monthly salary"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </label>

              <label>
                Amount (BDT)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  {(formType === "INCOME"
                    ? ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"]
                    : ["Food", "Transport", "Shopping", "Bills", "Education", "Health", "Entertainment", "Other"]
                  ).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                />
              </label>

              <label className="full-field">
                Description (optional)
                <textarea
                  rows="3"
                  maxLength={500}
                  placeholder="Add a note about this transaction..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>

              {notice && <p className="form-error">{notice}</p>}

              <div className="modal-actions full-field">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editingId ? "Save changes" : "Save transaction"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;