import { useEffect, useState } from "react";
import "./management.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7777/crm/api/v1";

const emptyForm = {
  companyName: "",
  companyCode: "",
  email: "",
  phone: "",
  address: "",
  industry: "OTHER"
};

function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("crmToken");

  const loadCompanies = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/companies`, {
        headers: { "x-access-token": token }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load companies");
      setCompanies(Array.isArray(data.companies) ? data.companies : []);
    } catch (err) {
      setCompanies([]);
      setMessage(err.message || "Unable to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCompanies(); }, []);

  const createCompany = async (event) => {
    event.preventDefault();
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to create company");
      setForm(emptyForm);
      setMessage("Company created successfully");
      await loadCompanies();
    } catch (err) {
      setMessage(err.message || "Unable to create company");
    } finally {
      setCreating(false);
    }
  };

  const changeStatus = async (companyId, status) => {
    setSaving(companyId);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/companies/${companyId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update company");
      setMessage("Company status updated");
      await loadCompanies();
    } catch (err) {
      setMessage(err.message || "Unable to update company");
    } finally {
      setSaving("");
    }
  };

  return (
    <section className="management-page">
      <div className="management-header">
        <div>
          <span className="management-kicker">TENANT ADMINISTRATION</span>
          <h1>Company Management</h1>
          <p>Create and control organizations using the CRM platform.</p>
        </div>
        <button className="management-refresh" onClick={loadCompanies}>Refresh</button>
      </div>

      <div className="company-layout">
        <form className="company-create-card" onSubmit={createCompany}>
          <div className="company-card-heading"><span>NEW TENANT</span><h3>Create Company</h3><p>Provision a new organization workspace.</p></div>
          <label>Company name<input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Technologies" required /></label>
          <div className="company-form-row">
            <label>Company code<input value={form.companyCode} onChange={(e) => setForm({ ...form, companyCode: e.target.value.toUpperCase() })} placeholder="ACME" required /></label>
            <label>Industry<input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="IT Services" /></label>
          </div>
          <label>Business email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="support@acme.com" required /></label>
          <div className="company-form-row">
            <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 ..." /></label>
            <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="City, State" /></label>
          </div>
          <button className="company-create-btn" disabled={creating}>{creating ? "Creating..." : "Create Company"}</button>
        </form>

        <div className="company-list-panel">
          <div className="company-list-heading"><div><span>ORGANIZATIONS</span><h3>Platform Companies</h3></div><strong>{companies.length}</strong></div>
          {message && <div className="management-message">{message}</div>}
          {loading ? <div className="management-empty">Loading companies...</div> : companies.length === 0 ? <div className="management-empty">No companies created yet.</div> : (
            <div className="company-list">
              {companies.map((company) => (
                <article className="company-row" key={company._id}>
                  <div className="company-avatar">{String(company.companyCode || company.companyName || "C").slice(0, 2).toUpperCase()}</div>
                  <div className="company-main"><strong>{company.companyName}</strong><span>{company.companyCode} · {company.industry || "OTHER"}</span><small>{company.email}</small></div>
                  <select value={company.status} disabled={saving === company._id} onChange={(e) => changeStatus(company._id, e.target.value)}><option value="ACTIVE">ACTIVE</option><option value="PENDING">PENDING</option><option value="INACTIVE">INACTIVE</option></select>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CompanyManagement;
