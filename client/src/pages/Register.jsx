
import { useState } from "react";

function Register({ onSwitchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (form.password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setMessage(
      "Registration form validated. Backend registration is not connected yet."
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">Finmate<span>.</span></div>

        <h1>Create your account</h1>
        <p>Start managing your personal finances.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full name
            <input
              type="text"
              required
              maxLength={100}
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              required
              minLength={8}
              placeholder="Enter password again"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
          </label>

          {message && <p role="status">{message}</p>}

          <button type="submit" className="primary-button">
            Create account
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" onClick={onSwitchToLogin}>
            Log in
          </button>
        </p>
      </section>
    </main>
  );
}

export default Register;
