import "./App.css";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7777/crm/api/v1";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState("admin");
  const [password, setPassword] = useState("Welcome1");
  const [message, setMessage] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [dashboardData, setDashboardData] = useState({ totalTickets: 0, openTickets: 0, inProgressTickets: 0, closedTickets: 0 });
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketMessage, setTicketMessage] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [updatingTicketId, setUpdatingTicketId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("3");
  const [ticketStatus, setTicketStatus] = useState("OPEN");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("crmUser");
    const token = localStorage.getItem("crmToken");
    if (savedUser && token) {
      try { setUser(JSON.parse(savedUser)); setIsLoggedIn(true); }
      catch { localStorage.removeItem("crmUser"); localStorage.removeItem("crmToken"); }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); setMessage("Logging in...");
    try {
      const response = await fetch(`${API_URL}/auth/signin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, password }) });
      const data = await response.json();
      if (!response.ok) return setMessage(data.message || "Login failed");
      if (!data.accessToken) return setMessage("Login successful but token not received");
      const loggedInUser = { name: data.name || "User", userId: data.userId || userId, email: data.email || "", userStatus: data.userStatus || "" };
      localStorage.setItem("crmToken", data.accessToken); localStorage.setItem("crmUser", JSON.stringify(loggedInUser));
      setUser(loggedInUser); setIsLoggedIn(true); setMessage(""); setActivePage("Dashboard");
    } catch { setMessage("Cannot connect to backend server"); }
  };

  const extractTickets = (data) => Array.isArray(data) ? data : Array.isArray(data?.tickets) ? data.tickets : Array.isArray(data?.data) ? data.data : [];

  const loadDashboard = async () => {
    const token = localStorage.getItem("crmToken"); if (!token) return;
    try {
      const response = await fetch(`${API_URL}/tickets`, { headers: { "Content-Type": "application/json", "x-access-token": token } });
      const data = await response.json(); if (!response.ok) return;
      const allTickets = extractTickets(data);
      setDashboardData({ totalTickets: allTickets.length, openTickets: allTickets.filter(t => t.status === "OPEN").length, inProgressTickets: allTickets.filter(t => t.status === "IN_PROGRESS").length, closedTickets: allTickets.filter(t => t.status === "CLOSED").length });
    } catch (error) { console.error(error); }
  };

  const loadTickets = async () => {
    const token = localStorage.getItem("crmToken"); if (!token) return setTicketMessage("Please login again");
    setTicketsLoading(true);
    try {
      const response = await fetch(`${API_URL}/tickets`, { headers: { "Content-Type": "application/json", "x-access-token": token } });
      const data = await response.json();
      if (!response.ok) { setTickets([]); return setTicketMessage(data.message || "Failed to load tickets"); }
      const allTickets = extractTickets(data); setTickets(allTickets);
      const map = {}; allTickets.forEach(t => map[t._id] = t.status || "OPEN"); setSelectedStatuses(map);
      setTicketMessage(allTickets.length ? "" : "No tickets found");
    } catch { setTickets([]); setTicketMessage("Cannot connect to backend"); }
    finally { setTicketsLoading(false); }
  };

  const handleUpdateStatus = async (ticket) => {
    const token = localStorage.getItem("crmToken"); if (!token) return setTicketMessage("Please login again");
    const newStatus = selectedStatuses[ticket._id] || ticket.status;
    if (newStatus === ticket.status) return setTicketMessage(`Ticket "${ticket.title}" already has ${newStatus} status`);
    setUpdatingTicketId(ticket._id);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket._id}`, { method: "PUT", headers: { "Content-Type": "application/json", "x-access-token": token }, body: JSON.stringify({ status: newStatus }) });
      const data = await response.json(); if (!response.ok) return setTicketMessage(data.message || "Failed to update ticket status");
      setTicketMessage(`Ticket status updated successfully to ${newStatus}!`); await loadDashboard(); await loadTickets();
    } catch { setTicketMessage("Cannot connect to backend while updating status"); }
    finally { setUpdatingTicketId(""); }
  };

  const loadUsers = async (typeFilter = userTypeFilter, statusFilter = userStatusFilter) => {
    const token = localStorage.getItem("crmToken"); if (!token) return setUserMessage("Please login again");
    setUsersLoading(true); setUserMessage("");
    try {
      const params = new URLSearchParams(); if (typeFilter) params.append("userType", typeFilter); if (statusFilter) params.append("userStatus", statusFilter);
      const response = await fetch(`${API_URL}/users${params.toString() ? `?${params}` : ""}`, { headers: { "Content-Type": "application/json", "x-access-token": token } });
      const data = await response.json(); if (!response.ok) { setUsers([]); return setUserMessage(data.message || "Failed to load users"); }
      const allUsers = Array.isArray(data) ? data : data.users || data.data || []; setUsers(allUsers); if (!allUsers.length) setUserMessage("No users found");
    } catch { setUsers([]); setUserMessage("Cannot connect to backend"); }
    finally { setUsersLoading(false); }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault(); const token = localStorage.getItem("crmToken"); if (!token) return setTicketMessage("Please login again");
    setTicketMessage("Creating ticket...");
    try {
      const response = await fetch(`${API_URL}/tickets`, { method: "POST", headers: { "Content-Type": "application/json", "x-access-token": token }, body: JSON.stringify({ title, description, ticketPriority: Number(ticketPriority), status: ticketStatus }) });
      const data = await response.json(); if (!response.ok) return setTicketMessage(data.message || "Failed to create ticket");
      setTitle(""); setDescription(""); setTicketPriority("3"); setTicketStatus("OPEN"); setTicketMessage("Ticket created successfully!"); await loadDashboard(); await loadTickets(); setActivePage("Tickets");
    } catch { setTicketMessage("Cannot connect to backend"); }
  };

  const handleNavigation = (page) => { setActivePage(page); setTicketMessage(""); setUserMessage(""); if (page === "Dashboard") loadDashboard(); if (page === "Tickets") loadTickets(); if (page === "Users") loadUsers(); };
  useEffect(() => { if (isLoggedIn) loadDashboard(); }, [isLoggedIn]);
  const handleLogout = () => { localStorage.removeItem("crmToken"); localStorage.removeItem("crmUser"); setIsLoggedIn(false); setUser(null); };

  if (!isLoggedIn) return <div className="login-page"><div className="login-card"><h1>EnterpriseFlow CRM</h1><p>Login to manage your support workspace</p><form onSubmit={handleLogin}><input type="text" placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} required/><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required/><button type="submit">Login</button></form>{message && <p className="message">{message}</p>}<div className="demo-box"><h3>Demo Admin Credentials</h3><p>User ID: <b>admin</b></p><p>Password: <b>Welcome1</b></p></div></div></div>;

  return <div><nav className="navbar"><h2>EnterpriseFlow CRM</h2><div><span>Welcome, {user?.name || "User"}</span><button onClick={handleLogout}>Logout</button></div></nav><div className="dashboard"><aside className="sidebar">{["Dashboard","Tickets","Create Ticket","Users"].map(page => <button key={page} className={activePage === page ? "active-nav" : ""} onClick={() => handleNavigation(page)}>{page === "Dashboard" ? "📊" : page === "Tickets" ? "🎫" : page === "Create Ticket" ? "➕" : "👥"} {page}</button>)}</aside><main className="main-content">
  {activePage === "Dashboard" && <><div className="page-header"><div><h1>Dashboard</h1><p>Overview of your support operations.</p></div><button className="refresh-btn" onClick={loadDashboard}>Refresh Dashboard</button></div><div className="stats">{[["Total Tickets",dashboardData.totalTickets],["Open Tickets",dashboardData.openTickets],["In Progress",dashboardData.inProgressTickets],["Closed Tickets",dashboardData.closedTickets]].map(([label,value]) => <div className="stat-card" key={label}><h3>{label}</h3><p>{value}</p></div>)}</div></>}
  {activePage === "Tickets" && <><div className="page-header"><div><h1>All Tickets</h1><p>View and manage support tickets.</p></div><button className="refresh-btn" onClick={loadTickets}>Refresh Tickets</button></div>{ticketMessage && <p className="message">{ticketMessage}</p>}{ticketsLoading ? <p>Loading tickets...</p> : tickets.length === 0 ? <div className="empty-state"><h3>No Tickets Found</h3><p>Create your first ticket.</p></div> : <div className="tickets-grid">{tickets.map(ticket => <div className="ticket-card" key={ticket._id}><h3>{ticket.title || "No Title"}</h3><p><b>Description:</b> {ticket.description || "No Description"}</p><p><b>Priority:</b> {ticket.ticketPriority || "N/A"}</p><p><b>Current Status:</b> <span className="status">{ticket.status || "OPEN"}</span></p><p><b>Reporter:</b> {ticket.reporter || "N/A"}</p>{ticket.assignee && <p><b>Assignee:</b> {ticket.assignee}</p>}<div className="update-status-section"><label><b>Update Status</b></label><select value={selectedStatuses[ticket._id] || ticket.status || "OPEN"} onChange={e => setSelectedStatuses(prev => ({...prev,[ticket._id]:e.target.value}))} disabled={updatingTicketId === ticket._id}><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN PROGRESS</option><option value="CLOSED">CLOSED</option></select><button className="update-status-btn" onClick={() => handleUpdateStatus(ticket)} disabled={updatingTicketId === ticket._id}>{updatingTicketId === ticket._id ? "Updating..." : "Update Status"}</button></div></div>)}</div>}</>}
  {activePage === "Create Ticket" && <><h1>Create Ticket</h1><p>Create a new support ticket.</p><div className="ticket-form-container"><form className="ticket-form" onSubmit={handleCreateTicket}><label>Ticket Title</label><input value={title} onChange={e=>setTitle(e.target.value)} required/><label>Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} required/><label>Priority</label><select value={ticketPriority} onChange={e=>setTicketPriority(e.target.value)}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select><label>Status</label><select value={ticketStatus} onChange={e=>setTicketStatus(e.target.value)}><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN PROGRESS</option><option value="CLOSED">CLOSED</option></select><button className="create-btn">Create Ticket</button></form>{ticketMessage && <p className="message">{ticketMessage}</p>}</div></>}
  {activePage === "Users" && <><div className="page-header"><div><h1>Users Management</h1><p>View registered CRM users.</p></div><button className="refresh-btn" onClick={() => loadUsers()}>Refresh Users</button></div><div className="user-filters"><div><label>User Type</label><select value={userTypeFilter} onChange={e=>setUserTypeFilter(e.target.value)}><option value="">All User Types</option><option value="ADMIN">ADMIN</option><option value="CUSTOMER">CUSTOMER</option><option value="ENGINEER">ENGINEER</option></select></div><div><label>User Status</label><select value={userStatusFilter} onChange={e=>setUserStatusFilter(e.target.value)}><option value="">All Status</option><option value="APPROVED">APPROVED</option><option value="PENDING">PENDING</option><option value="BLOCKED">BLOCKED</option></select></div><div className="filter-buttons"><button className="filter-btn" onClick={() => loadUsers()}>Apply Filter</button><button className="clear-btn" onClick={() => {setUserTypeFilter("");setUserStatusFilter("");loadUsers("","");}}>Clear</button></div></div>{userMessage && <p className="message">{userMessage}</p>}{usersLoading ? <p>Loading users...</p> : <div className="users-table-container"><table className="users-table"><thead><tr><th>Name</th><th>User ID</th><th>Email</th><th>User Type</th><th>Status</th></tr></thead><tbody>{users.map(u=><tr key={u._id || u.userId}><td>{u.name || "N/A"}</td><td>{u.userId || "N/A"}</td><td>{u.email || "N/A"}</td><td>{u.userType || "N/A"}</td><td><span className="status">{u.userStatus || "N/A"}</span></td></tr>)}</tbody></table></div>}</>}
</main></div></div>;
}

export default App;
