import { useState } from "react";

function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");

  return (
    <div>
      <nav className="navbar">
        <h2>CRM Ticketing System 🚀</h2>

        <div>
          <span>Welcome, {user.name}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard">
        <aside className="sidebar">
          <button onClick={() => setPage("dashboard")}>
            Dashboard
          </button>

          <button onClick={() => setPage("tickets")}>
            My Tickets
          </button>

          <button onClick={() => setPage("create")}>
            Create Ticket
          </button>
        </aside>

        <main className="main-content">
          {page === "dashboard" && (
            <>
              <h1>Dashboard</h1>

              <div className="stats">
                <div className="stat-card">
                  <h3>Total Tickets</h3>
                  <p>0</p>
                </div>

                <div className="stat-card">
                  <h3>Open Tickets</h3>
                  <p>0</p>
                </div>

                <div className="stat-card">
                  <h3>In Progress</h3>
                  <p>0</p>
                </div>

                <div className="stat-card">
                  <h3>Closed Tickets</h3>
                  <p>0</p>
                </div>
              </div>
            </>
          )}

          {page === "tickets" && (
            <>
              <h1>My Tickets</h1>
              <p>Tickets will appear here.</p>
            </>
          )}

          {page === "create" && (
            <>
              <h1>Create Ticket</h1>
              <p>Ticket creation form will appear here.</p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;