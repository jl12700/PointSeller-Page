import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/authContext";
import StudentSidebar from '../Components/studentsidebar';
import TopBar from '../Components/Topbar';
import '../Styles/pointsTopup.css';
import { useError } from "../contexts/errorContext";

function ExpenseTracking() {
  const { currentUser } = useAuth?.() || {};
  const storageKey = useMemo(() => {
    const uid = currentUser?.uid || "guest";
    return `psp.expenses.${uid}`;
  }, [currentUser]);

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ category: "Food", amount: "", note: "" });
  const { showError } = useError();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch (e) {
      showError('Failed to load saved expenses. Local storage may be unavailable.');
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      showError('Failed to save expenses. Storage might be full or disabled.');
    }
  }, [items, storageKey]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addItem(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      showError('Enter a valid amount greater than 0.', 'Invalid Amount');
      return;
    }
    const entry = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      category: form.category,
      amount,
      note: form.note?.trim() || "",
    };
    setItems((prev) => [entry, ...prev]);
    setForm({ category: form.category, amount: "", note: "" });
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  const total = items.reduce((sum, x) => sum + x.amount, 0);

  return (
    <div className="points-topup-wrapper">
      <TopBar />
      <StudentSidebar />
      <main className="points-topup-content">
        <section className="section">
          <h2>Expense Tracking</h2>

          <label className="form-label" htmlFor="exp-category">Category</label>
          <select
            id="exp-category"
            name="category"
            className="form-input"
            value={form.category}
            onChange={handleChange}
          >
            <option>Food</option>
            <option>Transport</option>
            <option>School</option>
            <option>Other</option>
          </select>

          <label className="form-label" htmlFor="exp-amount">Amount</label>
          <input
            id="exp-amount"
            name="amount"
            type="number"
            step="0.01"
            className="form-input"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
          />

          <label className="form-label" htmlFor="exp-note">Note</label>
          <input
            id="exp-note"
            name="note"
            className="form-input"
            value={form.note}
            onChange={handleChange}
            placeholder="Optional note"
          />

          <button className="btn-primary" onClick={addItem}>Add Expense</button>

          <p className="points-info" style={{ marginTop: 12 }}>
            <strong>Total:</strong> {total.toFixed(2)}
          </p>
        </section>

        <section className="section transaction-history">
          <h2>Expenses</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="no-data">No expenses yet.</td>
                </tr>
              ) : (
                items.map((x) => (
                  <tr key={x.id}>
                    <td>{new Date(x.ts).toLocaleString()}</td>
                    <td>{x.category}</td>
                    <td>{x.amount.toFixed(2)}</td>
                    <td>{x.note || '-'}</td>
                    <td>
                      <button type="button" className="btn-secondary" onClick={() => removeItem(x.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default ExpenseTracking;

