import { useEffect, useMemo, useState } from "react";
import "./management.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7777/crm/api/v1";

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("crmToken");
  const isSuperAdmin = currentUser?.userType === "SUPER_ADMIN";

  const loadCompanies = async () => {
    if (!isSuperAdmin) return;
    try {
      const response = await fetch(`${API_URL}/companies`, {
        headers: { "x-access-token": token }
      });
      const data = await response.json();
      if (response.ok) setCompanies(Array.isArray(data.companies) ? data.companies : []);
    } catch {
      // User management remains usable even if company lookup fails.
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("userType", roleFilter);
      if (statusFilter) params.set("userStatus", statusFilter);
      const response = await fetch(`${API_URL}/users${params.toString() ? `?${params}` : ""}`, {
        headers: { "x-access-token": token }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load users");
      setUsers(Array.isArray(data) ? data : data.users || data.data || []);
    } catch (err) {
      setUsers([]);
      setMessage(err.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  const companyMap = useMemo(() => {
    const result = {};
    companies.forEach((company) => { result[company._id] = company.companyName; });
    return result;
  }, [companies]);

  const updateUser = async (userId, patch) => {
    setSaving(userId);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token
        },
        body: JSON.stringify(patch)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "User update failed");
      setMessage(`Updated ${userId} successfully`);
      await loadUsers();
    } catch (err) {
      setMessage(err.message || "User update failed");
    } finally {
      setSaving("");
    }
  };

  const canEdit = (record) => {
    if (record.userType === "SUPER_ADMIN") return false;
    if (isSuperAdmin) return true;
    return record.userType !== "ADMIN";
  };

  return (
    <section className="management-page">
      <div className="management-header">
        <div>
          <span className="management-kicker">ACCESS CONTROL</span>
          <h1>User & Role Management</h1>
          <p>Approve users, manage CRM roles and control workspace access.</p>
        </div>
        <button className="management-refresh" onClick={loadUsers}>Refresh</button>
      </div>

      <div className="management-summary">
        <div><span>Total users</span><strong>{users.length}</strong></div>
        <div><span>Customers</span><strong>{users.filter((item) => item.userType === "CUSTOMER").length}</strong></div>
        <div><span>Engineers</span><strong>{users.filter((item) => item.userType === "ENGINEER").length}</strong></div>
        <div><span>Pending</span><strong>{users.filter((item) => item.userStatus === "PENDING").length}</strong></div>
      </div>

      <div className="management-toolbar">
        <div><label>Role</label><select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="">All roles</option><option value="CUSTOMER">Customer</option><option value="ENGINEER">Engineer</option><option value="ADMIN">Admin</option>{isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}</select></div>
        <div><label>Status</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option><option value="APPROVED">Approved</option><option value="PENDING">Pending</option><option value="BLOCKED">Blocked</option></select></div>
        <button onClick={loadUsers}>Apply Filters</button>
        <button className="secondary" onClick={() => { setRoleFilter(""); setStatusFilter(""); setTimeout(loadUsers, 0); }}>Clear</button>
      </div>

      {message && <div className="management-message">{message}</div>}

      <div className="management-table-wrap">
        {loading ? <div className="management-empty">Loading users...</div> : users.length === 0 ? <div className="management-empty">No users found.</div> : (
          <table className="management-table">
            <thead><tr><th>User</th><th>Role</th><th>Status</th>{isSuperAdmin && <th>Company</th>}<th>Access</th></tr></thead>
            <tbody>
              {users.map((record) => {
                const editable = canEdit(record);
                return (
                  <tr key={record._id || record.userId}>
                    <td><div className="user-cell"><span>{String(record.name || record.userId || "U").charAt(0).toUpperCase()}</span><div><strong>{record.name || record.userId}</strong><small>{record.email || record.userId}</small><small>@{record.userId}</small></div></div></td>
                    <td>
                      {editable ? <select value={record.userType} disabled={saving === record.userId} onChange={(e) => updateUser(record.userId, { userType: e.target.value })}><option value="CUSTOMER">CUSTOMER</option><option value="ENGINEER">ENGINEER</option>{isSuperAdmin && <option value="ADMIN">ADMIN</option>}</select> : <span className="role-badge">{record.userType}</span>}
                    </td>
                    <td>{editable ? <select value={record.userStatus} disabled={saving === record.userId} onChange={(e) => updateUser(record.userId, { userStatus: e.target.value })}><option value="APPROVED">APPROVED</option><option value="PENDING">PENDING</option><option value="BLOCKED">BLOCKED</option></select> : <span className={`access-badge ${String(record.userStatus).toLowerCase()}`}>{record.userStatus}</span>}</td>
                    {isSuperAdmin && <td>{editable ? <select value={record.companyId || ""} disabled={saving === record.userId} onChange={(e) => updateUser(record.userId, { companyId: e.target.value || null })}><option value="">No company</option>{companies.map((company) => <option key={company._id} value={company._id}>{company.companyName}</option>)}</select> : <span>{companyMap[record.companyId] || "Platform"}</span>}</td>}
                    <td><span className={`access-dot ${record.userStatus === "APPROVED" ? "online" : ""}`}></span>{saving === record.userId ? "Saving..." : editable ? "Managed" : "Protected"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default UserManagement;
