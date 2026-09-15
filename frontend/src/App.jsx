import "./App.css";
import { useEffect, useState } from "react";
import TicketDetails from "./TicketDetails";
import UserManagement from "./UserManagement";
import CompanyManagement from "./CompanyManagement";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7777/crm/api/v1";

const emptyDashboard = {
  totalTickets: 0,
  openTickets: 0,
  inProgressTickets: 0,
  closedTickets: 0,
  highPriorityTickets: 0,
  totalUsers: 0,
  customers: 0,
  engineers: 0,
  admins: 0,
  priorityBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  recentTickets: [],
  scope: ""
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState("admin");
  const [password, setPassword] = useState("Welcome1");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");

  const [dashboardData, setDashboardData] = useState(emptyDashboard);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState("");

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketMessage, setTicketMessage] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [updatingTicketId, setUpdatingTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("3");
  const [ticketStatus, setTicketStatus] = useState("OPEN");

  useEffect(() => {
    const savedUser = localStorage.getItem("crmUser");
    const token = localStorage.getItem("crmToken");
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("Signing in...");
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password })
      });
      const data = await response.json();
      if (!response.ok) return setMessage(data.message || "Login failed");

      const loggedInUser = {
        name: data.name || "User",
        userId: data.userId || userId,
        email: data.email || "",
        userStatus: data.userStatus || "",
        userType: data.userType || "",
        companyName: data.companyName || ""
      };

      localStorage.setItem("crmToken", data.accessToken);
      localStorage.setItem("crmUser", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setIsLoggedIn(true);
      setMessage("");
      setActivePage("Dashboard");
    } catch {
      setMessage("Cannot connect to backend server");
    }
  };

  const extractTickets = (data) =>
    Array.isArray(data)
      ? data
      : Array.isArray(data?.tickets)
        ? data.tickets
        : Array.isArray(data?.data)
          ? data.data
          : [];

  const loadDashboard = async () => {
    const token = localStorage.getItem("crmToken");
    if (!token) return;

    setDashboardLoading(true);
    setDashboardMessage("");
    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: { "x-access-token": token }
      });
      const data = await response.json();
      if (!response.ok) {
        setDashboardMessage(data.message || "Unable to load dashboard");
        return;
      }

      const stats = data.stats || {};
      setDashboardData({
        totalTickets: stats.totalTickets || 0,
        openTickets: stats.openTickets || 0,
        inProgressTickets: stats.inProgressTickets || 0,
        closedTickets: stats.closedTickets || 0,
        highPriorityTickets: stats.highPriorityTickets || 0,
        totalUsers: stats.totalUsers || 0,
        customers: stats.customers || 0,
        engineers: stats.engineers || 0,
        admins: stats.admins || 0,
        priorityBreakdown: data.priorityBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentTickets: Array.isArray(data.recentTickets) ? data.recentTickets : [],
        scope: data.scope || ""
      });
    } catch {
      setDashboardMessage("Cannot connect to dashboard service");
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadTickets = async () => {
    const token = localStorage.getItem("crmToken");
    setTicketsLoading(true);
    try {
      const response = await fetch(`${API_URL}/tickets`, {
        headers: { "x-access-token": token }
      });
      const data = await response.json();
      if (!response.ok) {
        setTickets([]);
        return setTicketMessage(data.message || "Failed to load tickets");
      }
      const list = extractTickets(data);
      setTickets(list);
      const selected = {};
      list.forEach((ticket) => {
        selected[ticket._id] = ticket.status || "OPEN";
      });
      setSelectedStatuses(selected);
      setTicketMessage(list.length ? "" : "No tickets found");
    } catch {
      setTicketMessage("Cannot connect to backend");
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleUpdateStatus = async (ticket) => {
    const token = localStorage.getItem("crmToken");
    const status = selectedStatuses[ticket._id] || ticket.status;
    if (status === ticket.status) return;

    setUpdatingTicketId(ticket._id);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) return setTicketMessage(data.message || "Update failed");
      setTicketMessage("Ticket updated successfully");
      await loadDashboard();
      await loadTickets();
    } catch {
      setTicketMessage("Update failed");
    } finally {
      setUpdatingTicketId("");
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("crmToken");
    setTicketMessage("Creating ticket...");
    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token
        },
        body: JSON.stringify({
          title,
          description,
          ticketPriority: Number(ticketPriority),
          status: ticketStatus
        })
      });
      const data = await response.json();
      if (!response.ok) return setTicketMessage(data.message || "Failed to create ticket");

      setTitle("");
      setDescription("");
      setTicketMessage("Ticket created successfully");
      await loadDashboard();
      await loadTickets();
      setActivePage("Tickets");
    } catch {
      setTicketMessage("Cannot connect to backend");
    }
  };

  const nav = (page) => {
    setSelectedTicket(null);
    setActivePage(page);
    setTicketMessage("");
    if (page === "Dashboard") loadDashboard();
    if (page === "Tickets") loadTickets();
  };

  useEffect(() => {
    if (isLoggedIn) loadDashboard();
  }, [isLoggedIn]);

  const logout = () => {
    localStorage.removeItem("crmToken");
    localStorage.removeItem("crmUser");
    setSelectedTicket(null);
    setIsLoggedIn(false);
    setUser(null);
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

  const priorityTotal = Object.values(dashboardData.priorityBreakdown || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const canManageUsers = ["ADMIN", "SUPER_ADMIN"].includes(user?.userType);
  const isSuperAdmin = user?.userType === "SUPER_ADMIN";
  const navigationPages = [
    "Dashboard",
    "Tickets",
    "Create Ticket",
    ...(canManageUsers ? ["Users"] : []),
    ...(isSuperAdmin ? ["Companies"] : [])
  ];

  if (!isLoggedIn) {
    return (
      <div className="reference-login">
        <header className="ref-header">
          <div className="ref-brand">
            <span className="ref-logo"><i></i><i></i><i></i></span>
            <div><strong>CRM Application</strong><small>Manage • Support • Grow</small></div>
          </div>
          <div className="ref-security">Secure <b>|</b> Scalable <b>|</b> Reliable <span></span></div>
        </header>
        <main className="ref-main">
          <section className="ref-hero">
            <div className="ref-copy">
              <div className="ref-eyebrow">SMARTER SUPPORT</div>
              <h1>Powering<br />Better <em>Business</em></h1>
              <p>A unified platform to manage customers,<br />track issues, and deliver exceptional support.</p>
              <div className="ref-features">
                <div><b>▣</b><span><strong>Ticket Management</strong><small>Track and resolve efficiently</small></span></div>
                <div><b>♙</b><span><strong>Team Collaboration</strong><small>Work together seamlessly</small></span></div>
                <div><b>◇</b><span><strong>Data Security</strong><small>Your data stays protected</small></span></div>
                <div><b>▥</b><span><strong>Insightful Analytics</strong><small>Make better decisions</small></span></div>
              </div>
            </div>
            <div className="ref-person">
              <div className="world-grid"></div>
              <div className="person-silhouette"><span className="head"></span><span className="body"></span></div>
              <div className="hud-ring r1"></div><div className="hud-ring r2"></div>
              <span className="hud h1">♟</span><span className="hud h2">⚙</span><span className="hud h3">↗</span><span className="hud h4">▤</span>
              <div className="finger-glow"></div>
              <blockquote>“Secure Systems<br />Stronger Businesses”</blockquote>
            </div>
          </section>
          <section className="ref-auth">
            <div className="ref-card">
              <div className="protected">♢ <span>Protected<br />& Secure</span></div>
              <h2>Welcome Back</h2>
              <p>Sign in to your CRM account</p>
              <form onSubmit={handleLogin}>
                <label>Username / Email</label>
                <div className="field"><span>♙</span><input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter your username or email" required /></div>
                <label>Password</label>
                <div className="field"><span>♢</span><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required /><button type="button" className="eye" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "◉" : "◎"}</button></div>
                <div className="ref-options"><label><input type="checkbox" /> Remember me</label><button type="button">Forgot password?</button></div>
                <button className="ref-signin">Sign In <span>→</span></button>
              </form>
              {message && <div className="auth-message">{message}</div>}
              <div className="or"><span></span>OR<span></span></div>
              <div className="social-row"><button><b className="google">G</b> Continue with Google</button><button><b className="microsoft">⊞</b> Continue with Microsoft</button></div>
              <div className="new-crm">New to CRM? <span>Contact your administrator</span></div>
            </div>
          </section>
        </main>
        <footer className="ref-footer"><div><span className="mini-logo">▥</span> CRM Application <small>© 2026. All rights reserved.</small></div><div>Privacy&nbsp;&nbsp; | &nbsp;&nbsp;Terms&nbsp;&nbsp; | &nbsp;&nbsp;Support</div><div><i></i> All Systems Operational</div></footer>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <h2>EnterpriseFlow CRM</h2>
        <div><span>{user?.companyName || "Enterprise Workspace"} · {user?.name || "User"} · {user?.userType?.replace("_", " ")}</span><button onClick={logout}>Logout</button></div>
      </nav>

      <div className="dashboard">
        <aside className="sidebar">
          {navigationPages.map((page) => (
            <button key={page} className={activePage === page ? "active-nav" : ""} onClick={() => nav(page)}>
              {page === "Dashboard" ? "▦" : page === "Tickets" ? "▤" : page === "Create Ticket" ? "＋" : page === "Users" ? "♙" : "▧"} {page}
            </button>
          ))}
        </aside>

        <main className="main-content">
          {activePage === "Dashboard" && (
            <>
              <div className="page-header">
                <div>
                  <div className="dashboard-kicker">CRM SERVICE DESK</div>
                  <h1>Operations Dashboard</h1>
                  <p>Live support workload, team capacity and recent ticket activity.</p>
                </div>
                <button className="refresh-btn" onClick={loadDashboard} disabled={dashboardLoading}>{dashboardLoading ? "Refreshing..." : "Refresh"}</button>
              </div>

              {dashboardMessage && <p className="message">{dashboardMessage}</p>}

              <div className="stats dashboard-primary-stats">
                {[
                  ["Total Tickets", dashboardData.totalTickets, "All requests", "cyan"],
                  ["Open Tickets", dashboardData.openTickets, "Need attention", "orange"],
                  ["In Progress", dashboardData.inProgressTickets, "Being handled", "purple"],
                  ["Resolved", dashboardData.closedTickets, "Completed", "green"]
                ].map(([label, value, note, tone]) => (
                  <div className={`stat-card ${tone}`} key={label}>
                    <div className="stat-label">{label}</div>
                    <div className="stat-value">{value}</div>
                    <div className="stat-note">{note}</div>
                  </div>
                ))}
              </div>

              <div className="dashboard-secondary-stats">
                <div className="mini-stat"><span>High Priority</span><strong>{dashboardData.highPriorityTickets}</strong><small>Priority 1 tickets</small></div>
                <div className="mini-stat"><span>Customers</span><strong>{dashboardData.customers}</strong><small>Registered requesters</small></div>
                <div className="mini-stat"><span>Engineers</span><strong>{dashboardData.engineers}</strong><small>Support agents</small></div>
                <div className="mini-stat"><span>Total Users</span><strong>{dashboardData.totalUsers}</strong><small>{dashboardData.admins} administrator{dashboardData.admins === 1 ? "" : "s"}</small></div>
              </div>

              <div className="crm-dashboard-grid">
                <section className="dashboard-panel recent-panel">
                  <div className="panel-heading">
                    <div><span className="panel-eyebrow">LATEST ACTIVITY</span><h3>Recent Tickets</h3></div>
                    <button onClick={() => nav("Tickets")}>View all</button>
                  </div>
                  {dashboardData.recentTickets.length === 0 ? (
                    <div className="panel-empty"><strong>No tickets yet</strong><span>Create a support ticket to start the workflow.</span></div>
                  ) : (
                    <div className="recent-ticket-list">
                      {dashboardData.recentTickets.map((ticket) => (
                        <div className="recent-ticket-row" key={ticket._id} onClick={() => setSelectedTicket(ticket)}>
                          <div className="ticket-dot"></div>
                          <div className="recent-ticket-main"><strong>{ticket.title}</strong><span>{ticket.reporter || "Unknown requester"} · {formatDate(ticket.createdAt)}</span></div>
                          <span className={`ticket-status-badge ${(ticket.status || "").toLowerCase()}`}>{(ticket.status || "OPEN").replace("_", " ")}</span>
                          <span className="priority-pill">P{ticket.ticketPriority || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dashboard-panel priority-panel">
                  <div className="panel-heading"><div><span className="panel-eyebrow">WORKLOAD</span><h3>Priority Breakdown</h3></div></div>
                  <div className="priority-bars">
                    {[1, 2, 3, 4, 5].map((priority) => {
                      const count = Number(dashboardData.priorityBreakdown?.[priority] || 0);
                      const width = priorityTotal ? Math.max((count / priorityTotal) * 100, count ? 8 : 0) : 0;
                      return (
                        <div className="priority-row" key={priority}>
                          <div className="priority-meta"><span>Priority {priority}</span><strong>{count}</strong></div>
                          <div className="priority-track"><span style={{ width: `${width}%` }}></span></div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="dashboard-panel workflow-panel">
                  <div className="panel-heading"><div><span className="panel-eyebrow">SERVICE WORKFLOW</span><h3>Ticket Lifecycle</h3></div></div>
                  <div className="workflow-steps">
                    <div><span>01</span><strong>Open</strong><small>Request received</small></div>
                    <i>→</i>
                    <div><span>02</span><strong>In Progress</strong><small>Engineer working</small></div>
                    <i>→</i>
                    <div><span>03</span><strong>Resolved</strong><small>Request completed</small></div>
                  </div>
                </section>

                <section className="dashboard-panel team-panel">
                  <div className="panel-heading"><div><span className="panel-eyebrow">WORKSPACE</span><h3>Support Team</h3></div></div>
                  <div className="team-metrics">
                    <div><span>Engineers</span><strong>{dashboardData.engineers}</strong></div>
                    <div><span>Customers</span><strong>{dashboardData.customers}</strong></div>
                    <div><span>Admins</span><strong>{dashboardData.admins}</strong></div>
                  </div>
                  <div className="scope-chip">View: {dashboardData.scope ? dashboardData.scope.replaceAll("_", " ") : "WORKSPACE"}</div>
                </section>
              </div>
            </>
          )}

          {activePage === "Tickets" && (
            <>
              <div className="page-header"><div><h1>Support Tickets</h1><p>Monitor and manage customer requests.</p></div><button className="refresh-btn" onClick={loadTickets}>Refresh</button></div>
              {ticketMessage && <p className="message">{ticketMessage}</p>}
              {ticketsLoading ? <p>Loading tickets...</p> : tickets.length === 0 ? <div className="empty-state"><h3>No tickets yet</h3><p>Create a support request to get started.</p></div> : (
                <div className="tickets-grid">
                  {tickets.map((ticket) => (
                    <div className="ticket-card" key={ticket._id}>
                      <h3>{ticket.title}</h3><p>{ticket.description}</p><p><b>Priority:</b> {ticket.ticketPriority}</p><p><b>Status:</b> <span className="status">{ticket.status}</span></p><p><b>Reporter:</b> {ticket.reporter}</p>{ticket.assignee && <p><b>Assignee:</b> {ticket.assignee}</p>}
                      <div className="update-status-section"><select value={selectedStatuses[ticket._id] || ticket.status} onChange={(e) => setSelectedStatuses((previous) => ({ ...previous, [ticket._id]: e.target.value }))}><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN PROGRESS</option><option value="CLOSED">CLOSED</option></select><button className="update-status-btn" onClick={() => handleUpdateStatus(ticket)} disabled={updatingTicketId === ticket._id}>{updatingTicketId === ticket._id ? "Updating..." : "Update Status"}</button></div>
                      <button className="view-details-btn" onClick={() => setSelectedTicket(ticket)}>View Details & Activity</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activePage === "Create Ticket" && (
            <>
              <h1>Create Support Ticket</h1><p>Submit a new customer or internal support request.</p>
              <div className="ticket-form-container"><form className="ticket-form" onSubmit={handleCreateTicket}><label>Ticket title</label><input value={title} onChange={(e) => setTitle(e.target.value)} required /><label>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required /><label>Priority</label><select value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select><label>Status</label><select value={ticketStatus} onChange={(e) => setTicketStatus(e.target.value)}><option>OPEN</option><option value="IN_PROGRESS">IN PROGRESS</option><option>CLOSED</option></select><button className="create-btn">Create Ticket</button></form>{ticketMessage && <p className="message">{ticketMessage}</p>}</div>
            </>
          )}

          {activePage === "Users" && canManageUsers && <UserManagement currentUser={user} />}
          {activePage === "Companies" && isSuperAdmin && <CompanyManagement />}
        </main>
      </div>

      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onChanged={() => {
            loadDashboard();
            loadTickets();
          }}
        />
      )}
    </div>
  );
}

export default App;
