import "./App.css";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:7777/crm/api/v1";

function App() {
  // ================= LOGIN =================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [userId, setUserId] = useState("admin");
  const [password, setPassword] = useState("Welcome1");
  const [message, setMessage] = useState("");

  // ================= NAVIGATION =================
  const [activePage, setActivePage] = useState("Dashboard");

  // ================= DASHBOARD =================
  const [dashboardData, setDashboardData] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    closedTickets: 0,
  });

  // ================= TICKETS =================
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketMessage, setTicketMessage] = useState("");

  // ================= UPDATE TICKET STATUS =================
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [updatingTicketId, setUpdatingTicketId] = useState("");

  // ================= CREATE TICKET =================
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("3");
  const [ticketStatus, setTicketStatus] = useState("OPEN");

  // ================= USERS =================
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");

  // ================= CHECK SAVED LOGIN =================
  useEffect(() => {
    const savedUser = localStorage.getItem("crmUser");
    const token = localStorage.getItem("crmToken");

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Saved user error:", error);

        localStorage.removeItem("crmUser");
        localStorage.removeItem("crmToken");
      }
    }
  }, []);

  // ================= LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("Logging in...");

    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          password,
        }),
      });

      const data = await response.json();

      console.log("Login Response:", data);

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      const token = data.accessToken;

      if (!token) {
        setMessage("Login successful but token not received");
        return;
      }

      const loggedInUser = {
        name: data.name || "User",
        userId: data.userId || userId,
        email: data.email || "",
        userStatus: data.userStatus || "",
      };

      localStorage.setItem("crmToken", token);

      localStorage.setItem(
        "crmUser",
        JSON.stringify(loggedInUser)
      );

      setUser(loggedInUser);
      setIsLoggedIn(true);
      setMessage("");
      setActivePage("Dashboard");
    } catch (error) {
      console.error("Login Error:", error);
      setMessage("Cannot connect to backend server");
    }
  };

  // ================= GET TICKETS ARRAY =================
  const extractTickets = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.tickets)) {
      return data.tickets;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  };

  // ================= LOAD DASHBOARD =================
  const loadDashboard = async () => {
    const token = localStorage.getItem("crmToken");

    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      });

      const data = await response.json();

      console.log("Dashboard Tickets Data:", data);

      if (!response.ok) {
        console.error(
          data.message || "Failed to load dashboard"
        );
        return;
      }

      const allTickets = extractTickets(data);

      const totalTickets = allTickets.length;

      const openTickets = allTickets.filter(
        (ticket) => ticket.status === "OPEN"
      ).length;

      const inProgressTickets = allTickets.filter(
        (ticket) => ticket.status === "IN_PROGRESS"
      ).length;

      const closedTickets = allTickets.filter(
        (ticket) => ticket.status === "CLOSED"
      ).length;

      setDashboardData({
        totalTickets,
        openTickets,
        inProgressTickets,
        closedTickets,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  };

  // ================= LOAD ALL TICKETS =================
  const loadTickets = async () => {
    const token = localStorage.getItem("crmToken");

    if (!token) {
      setTicketMessage("Please login again");
      return;
    }

    setTicketsLoading(true);

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      });

      const data = await response.json();

      console.log("Tickets Data:", data);

      if (!response.ok) {
        setTicketMessage(
          data.message || "Failed to load tickets"
        );

        setTickets([]);
        return;
      }

      const allTickets = extractTickets(data);

      setTickets(allTickets);

      // Initialize status dropdown for every ticket
      const statusMap = {};

      allTickets.forEach((ticket) => {
        statusMap[ticket._id] = ticket.status || "OPEN";
      });

      setSelectedStatuses(statusMap);

      if (allTickets.length === 0) {
        setTicketMessage("No tickets found");
      } else {
        setTicketMessage("");
      }
    } catch (error) {
      console.error("Tickets Error:", error);

      setTicketMessage("Cannot connect to backend");
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  // ================= UPDATE SELECTED STATUS =================
  const handleStatusChange = (ticketId, newStatus) => {
    setSelectedStatuses((previousStatus) => ({
      ...previousStatus,
      [ticketId]: newStatus,
    }));
  };

  // ================= UPDATE TICKET STATUS =================
  const handleUpdateStatus = async (ticket) => {
    const token = localStorage.getItem("crmToken");

    if (!token) {
      setTicketMessage("Please login again");
      return;
    }

    const newStatus =
      selectedStatuses[ticket._id] || ticket.status;

    if (!newStatus) {
      setTicketMessage("Please select a status");
      return;
    }

    if (newStatus === ticket.status) {
      setTicketMessage(
        `Ticket "${ticket.title}" already has ${newStatus} status`
      );
      return;
    }

    setUpdatingTicketId(ticket._id);

    setTicketMessage(
      `Updating status of "${ticket.title}"...`
    );

    try {
      const response = await fetch(
        `${API_URL}/tickets/${ticket._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": token,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      console.log("Update Ticket Response:", data);

      if (!response.ok) {
        setTicketMessage(
          data.message || "Failed to update ticket status"
        );
        return;
      }

      setTicketMessage(
        `Ticket status updated successfully to ${newStatus}! 🎉`
      );

      // Update local ticket list immediately
      setTickets((previousTickets) =>
        previousTickets.map((singleTicket) =>
          singleTicket._id === ticket._id
            ? {
                ...singleTicket,
                status: newStatus,
              }
            : singleTicket
        )
      );

      // Refresh dashboard counts
      await loadDashboard();

      // Refresh ticket list from backend
      await loadTickets();

      setTimeout(() => {
        setTicketMessage("");
      }, 2500);
    } catch (error) {
      console.error("Update Ticket Status Error:", error);

      setTicketMessage(
        "Cannot connect to backend while updating status"
      );
    } finally {
      setUpdatingTicketId("");
    }
  };

  // ================= LOAD USERS =================
  const loadUsers = async (
    typeFilter = userTypeFilter,
    statusFilter = userStatusFilter
  ) => {
    const token = localStorage.getItem("crmToken");

    if (!token) {
      setUserMessage("Please login again");
      return;
    }

    setUsersLoading(true);
    setUserMessage("");

    try {
      let url = `${API_URL}/users`;

      const params = new URLSearchParams();

      if (typeFilter) {
        params.append("userType", typeFilter);
      }

      if (statusFilter) {
        params.append("userStatus", statusFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      });

      const data = await response.json();

      console.log("Users Data:", data);

      if (!response.ok) {
        setUserMessage(
          data.message || "Failed to load users"
        );

        setUsers([]);
        return;
      }

      let allUsers = [];

      if (Array.isArray(data)) {
        allUsers = data;
      } else if (Array.isArray(data?.users)) {
        allUsers = data.users;
      } else if (Array.isArray(data?.data)) {
        allUsers = data.data;
      }

      setUsers(allUsers);

      if (allUsers.length === 0) {
        setUserMessage("No users found");
      }
    } catch (error) {
      console.error("Users Error:", error);

      setUserMessage("Cannot connect to backend");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // ================= APPLY USER FILTER =================
  const handleUserFilter = () => {
    loadUsers(userTypeFilter, userStatusFilter);
  };

  // ================= CLEAR USER FILTER =================
  const clearUserFilter = () => {
    setUserTypeFilter("");
    setUserStatusFilter("");

    loadUsers("", "");
  };

  // ================= CREATE TICKET =================
  const handleCreateTicket = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("crmToken");

    if (!token) {
      setTicketMessage("Please login again");
      return;
    }

    setTicketMessage("Creating ticket...");

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          title,
          description,
          ticketPriority: Number(ticketPriority),
          status: ticketStatus,
        }),
      });

      const data = await response.json();

      console.log("Create Ticket Response:", data);

      if (!response.ok) {
        setTicketMessage(
          data.message || "Failed to create ticket"
        );
        return;
      }

      setTicketMessage(
        "Ticket created successfully! 🎉"
      );

      // Clear form
      setTitle("");
      setDescription("");
      setTicketPriority("3");
      setTicketStatus("OPEN");

      // Refresh dashboard
      await loadDashboard();

      // Refresh tickets
      await loadTickets();

      // Go to tickets page
      setTimeout(() => {
        setActivePage("Tickets");
        setTicketMessage("");
      }, 800);
    } catch (error) {
      console.error("Create Ticket Error:", error);

      setTicketMessage("Cannot connect to backend");
    }
  };

  // ================= NAVIGATION =================
  const handleNavigation = (page) => {
    setActivePage(page);

    setTicketMessage("");
    setUserMessage("");

    if (page === "Dashboard") {
      loadDashboard();
    }

    if (page === "Tickets") {
      loadTickets();
    }

    if (page === "Users") {
      loadUsers();
    }
  };

  // ================= INITIAL DASHBOARD LOAD =================
  useEffect(() => {
    if (isLoggedIn) {
      loadDashboard();
    }
  }, [isLoggedIn]);

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("crmToken");
    localStorage.removeItem("crmUser");

    setIsLoggedIn(false);
    setUser(null);

    setActivePage("Dashboard");

    setTickets([]);
    setUsers([]);
    setSelectedStatuses({});

    setDashboardData({
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      closedTickets: 0,
    });

    setMessage("");
    setTicketMessage("");
    setUserMessage("");

    setUserTypeFilter("");
    setUserStatusFilter("");

    setUpdatingTicketId("");
  };

  // ================= LOGIN PAGE =================
  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>CRM Ticketing System 🚀</h1>

          <p>Login to manage your tickets</p>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="User ID"
              value={userId}
              onChange={(e) =>
                setUserId(e.target.value)
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            <button type="submit">
              Login
            </button>
          </form>

          {message && (
            <p className="message">
              {message}
            </p>
          )}

          <div className="demo-box">
            <h3>Demo Admin Credentials</h3>

            <p>
              User ID: <b>admin</b>
            </p>

            <p>
              Password: <b>Welcome1</b>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ================= MAIN APP =================
  return (
    <div>
      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <h2>CRM Ticketing System 🚀</h2>

        <div>
          <span>
            Welcome, {user?.name || "User"}
          </span>

          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard">
        {/* ================= SIDEBAR ================= */}
        <aside className="sidebar">
          <button
            className={
              activePage === "Dashboard"
                ? "active-nav"
                : ""
            }
            onClick={() =>
              handleNavigation("Dashboard")
            }
          >
            📊 Dashboard
          </button>

          <button
            className={
              activePage === "Tickets"
                ? "active-nav"
                : ""
            }
            onClick={() =>
              handleNavigation("Tickets")
            }
          >
            🎫 Tickets
          </button>

          <button
            className={
              activePage === "Create Ticket"
                ? "active-nav"
                : ""
            }
            onClick={() =>
              handleNavigation("Create Ticket")
            }
          >
            ➕ Create Ticket
          </button>

          <button
            className={
              activePage === "Users"
                ? "active-nav"
                : ""
            }
            onClick={() =>
              handleNavigation("Users")
            }
          >
            👥 Users
          </button>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="main-content">

          {/* ================= DASHBOARD ================= */}
          {activePage === "Dashboard" && (
            <>
              <div className="page-header">
                <div>
                  <h1>Dashboard</h1>

                  <p>
                    Welcome to your CRM Ticketing System dashboard.
                  </p>
                </div>

                <button
                  className="refresh-btn"
                  onClick={loadDashboard}
                >
                  Refresh Dashboard
                </button>
              </div>

              <div className="stats">
                <div className="stat-card">
                  <h3>Total Tickets</h3>
                  <p>
                    {dashboardData.totalTickets}
                  </p>
                </div>

                <div className="stat-card">
                  <h3>Open Tickets</h3>
                  <p>
                    {dashboardData.openTickets}
                  </p>
                </div>

                <div className="stat-card">
                  <h3>In Progress</h3>
                  <p>
                    {dashboardData.inProgressTickets}
                  </p>
                </div>

                <div className="stat-card">
                  <h3>Closed Tickets</h3>
                  <p>
                    {dashboardData.closedTickets}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ================= TICKETS ================= */}
          {activePage === "Tickets" && (
            <>
              <div className="page-header">
                <div>
                  <h1>All Tickets</h1>

                  <p>
                    View and manage all support tickets.
                  </p>
                </div>

                <button
                  className="refresh-btn"
                  onClick={loadTickets}
                >
                  Refresh Tickets
                </button>
              </div>

              {ticketMessage && (
                <p className="message">
                  {ticketMessage}
                </p>
              )}

              {ticketsLoading ? (
                <p>Loading tickets...</p>
              ) : tickets.length === 0 ? (
                <div className="empty-state">
                  <h3>No Tickets Found</h3>

                  <p>
                    Create your first ticket using Create Ticket.
                  </p>
                </div>
              ) : (
                <div className="tickets-grid">
                  {tickets.map((ticket) => (
                    <div
                      className="ticket-card"
                      key={ticket._id}
                    >
                      <h3>
                        {ticket.title || "No Title"}
                      </h3>

                      <p>
                        <b>Description:</b>{" "}
                        {ticket.description ||
                          "No Description"}
                      </p>

                      <p>
                        <b>Priority:</b>{" "}
                        {ticket.ticketPriority || "N/A"}
                      </p>

                      <p>
                        <b>Current Status:</b>{" "}
                        <span className="status">
                          {ticket.status || "OPEN"}
                        </span>
                      </p>

                      <p>
                        <b>Reporter:</b>{" "}
                        {ticket.reporter || "N/A"}
                      </p>

                      {ticket.assignee && (
                        <p>
                          <b>Assignee:</b>{" "}
                          {ticket.assignee}
                        </p>
                      )}

                      {ticket.createdAt && (
                        <p>
                          <b>Created:</b>{" "}
                          {new Date(
                            ticket.createdAt
                          ).toLocaleString()}
                        </p>
                      )}

                      {/* ================= UPDATE STATUS ================= */}
                      <div className="update-status-section">
                        <label>
                          <b>Update Status</b>
                        </label>

                        <select
                          value={
                            selectedStatuses[ticket._id] ||
                            ticket.status ||
                            "OPEN"
                          }
                          onChange={(e) =>
                            handleStatusChange(
                              ticket._id,
                              e.target.value
                            )
                          }
                          disabled={
                            updatingTicketId === ticket._id
                          }
                        >
                          <option value="OPEN">
                            OPEN
                          </option>

                          <option value="IN_PROGRESS">
                            IN PROGRESS
                          </option>

                          <option value="CLOSED">
                            CLOSED
                          </option>
                        </select>

                        <button
                          type="button"
                          className="update-status-btn"
                          onClick={() =>
                            handleUpdateStatus(ticket)
                          }
                          disabled={
                            updatingTicketId === ticket._id
                          }
                        >
                          {updatingTicketId === ticket._id
                            ? "Updating..."
                            : "Update Status"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ================= CREATE TICKET ================= */}
          {activePage === "Create Ticket" && (
            <>
              <h1>Create Ticket</h1>

              <p>
                Create a new support ticket.
              </p>

              <div className="ticket-form-container">
                <form
                  className="ticket-form"
                  onSubmit={handleCreateTicket}
                >
                  <label>Ticket Title</label>

                  <input
                    type="text"
                    placeholder="Enter ticket title"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    required
                  />

                  <label>Description</label>

                  <textarea
                    placeholder="Describe your issue"
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    required
                  />

                  <label>Priority</label>

                  <select
                    value={ticketPriority}
                    onChange={(e) =>
                      setTicketPriority(e.target.value)
                    }
                  >
                    <option value="1">
                      1 - Low
                    </option>

                    <option value="2">
                      2 - Medium Low
                    </option>

                    <option value="3">
                      3 - Medium
                    </option>

                    <option value="4">
                      4 - High
                    </option>

                    <option value="5">
                      5 - Critical
                    </option>
                  </select>

                  <label>Status</label>

                  <select
                    value={ticketStatus}
                    onChange={(e) =>
                      setTicketStatus(e.target.value)
                    }
                  >
                    <option value="OPEN">
                      OPEN
                    </option>

                    <option value="IN_PROGRESS">
                      IN PROGRESS
                    </option>

                    <option value="CLOSED">
                      CLOSED
                    </option>
                  </select>

                  <button
                    type="submit"
                    className="create-btn"
                  >
                    Create Ticket
                  </button>
                </form>

                {ticketMessage && (
                  <p className="message">
                    {ticketMessage}
                  </p>
                )}
              </div>
            </>
          )}

          {/* ================= USERS MANAGEMENT ================= */}
          {activePage === "Users" && (
            <>
              <div className="page-header">
                <div>
                  <h1>Users Management</h1>

                  <p>
                    View all registered users in the CRM system.
                  </p>
                </div>

                <button
                  className="refresh-btn"
                  onClick={() => loadUsers()}
                >
                  Refresh Users
                </button>
              </div>

              {/* USER FILTERS */}
              <div className="user-filters">
                <div>
                  <label>User Type</label>

                  <select
                    value={userTypeFilter}
                    onChange={(e) =>
                      setUserTypeFilter(e.target.value)
                    }
                  >
                    <option value="">
                      All User Types
                    </option>

                    <option value="ADMIN">
                      ADMIN
                    </option>

                    <option value="CUSTOMER">
                      CUSTOMER
                    </option>

                    <option value="ENGINEER">
                      ENGINEER
                    </option>
                  </select>
                </div>

                <div>
                  <label>User Status</label>

                  <select
                    value={userStatusFilter}
                    onChange={(e) =>
                      setUserStatusFilter(e.target.value)
                    }
                  >
                    <option value="">
                      All Status
                    </option>

                    <option value="APPROVED">
                      APPROVED
                    </option>

                    <option value="PENDING">
                      PENDING
                    </option>

                    <option value="REJECTED">
                      REJECTED
                    </option>
                  </select>
                </div>

                <div className="filter-buttons">
                  <button
                    className="filter-btn"
                    onClick={handleUserFilter}
                  >
                    Apply Filter
                  </button>

                  <button
                    className="clear-btn"
                    onClick={clearUserFilter}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {userMessage && (
                <p className="message">
                  {userMessage}
                </p>
              )}

              {usersLoading ? (
                <p>Loading users...</p>
              ) : users.length === 0 ? (
                <div className="empty-state">
                  <h3>No Users Found</h3>

                  <p>
                    No users are available with the selected filters.
                  </p>
                </div>
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>User ID</th>
                        <th>Email</th>
                        <th>User Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((singleUser) => (
                        <tr
                          key={
                            singleUser._id ||
                            singleUser.userId
                          }
                        >
                          <td>
                            {singleUser.name || "N/A"}
                          </td>

                          <td>
                            {singleUser.userId || "N/A"}
                          </td>

                          <td>
                            {singleUser.email || "N/A"}
                          </td>

                          <td>
                            {singleUser.userType || "N/A"}
                          </td>

                          <td>
                            <span className="status">
                              {singleUser.userStatus ||
                                "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;