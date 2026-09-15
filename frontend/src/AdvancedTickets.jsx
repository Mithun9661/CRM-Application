import { useCallback, useEffect, useState } from "react";
import "./advanced-tickets.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7777/crm/api/v1";

const initialFilters = {
  search: "",
  status: "",
  priority: "",
  assignee: "",
  fromDate: "",
  toDate: "",
  sort: "newest",
  limit: "6"
};

function AdvancedTickets({ currentUser, onOpenTicket, onChanged, refreshVersion = 0 }) {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const canManageStatus = currentUser?.userType !== "CUSTOMER";
  const canFilterAssignee = ["ADMIN", "SUPER_ADMIN"].includes(currentUser?.userType);

  const loadTickets = useCallback(async (targetPage = page, activeFilters = appliedFilters) => {
    const token = localStorage.getItem("crmToken");
    if (!token) return;

    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", activeFilters.limit || "6");
      if (activeFilters.search.trim()) params.set("search", activeFilters.search.trim());
      if (activeFilters.status) params.set("status", activeFilters.status);
      if (activeFilters.priority) params.set("priority", activeFilters.priority);
      if (activeFilters.assignee.trim() && canFilterAssignee) params.set("assignee", activeFilters.assignee.trim());
      if (activeFilters.fromDate) params.set("fromDate", activeFilters.fromDate);
      if (activeFilters.toDate) params.set("toDate", activeFilters.toDate);
      if (activeFilters.sort) params.set("sort", activeFilters.sort);

      const response = await fetch(`${API_URL}/tickets?${params.toString()}`, {
        headers: { "x-access-token": token }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load tickets");

      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setPage(Number(data.page) || targetPage);
      setTotalPages(Number(data.totalPages) || 1);
      setTotalTickets(Number(data.totalTickets) || 0);
    } catch (err) {
      setTickets([]);
      setMessage(err.message || "Unable to load tickets");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, canFilterAssignee, page]);

  useEffect(() => {
    loadTickets(1, appliedFilters);
  }, [refreshVersion]);

  useEffect(() => {
    const refresh = () => loadTickets(page, appliedFilters);
    window.addEventListener("crm:tickets-changed", refresh);
    return () => window.removeEventListener("crm:tickets-changed", refresh);
  }, [loadTickets, page, appliedFilters]);

  const applyFilters = (event) => {
    event?.preventDefault();
    setAppliedFilters(filters);
    setPage(1);
    loadTickets(1, filters);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
    loadTickets(1, initialFilters);
  };

  const changePage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    loadTickets(nextPage, appliedFilters);
  };

  const updateStatus = async (ticket, nextStatus) => {
    if (!canManageStatus || nextStatus === ticket.status) return;
    setUpdatingId(ticket._id);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": localStorage.getItem("crmToken")
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update ticket");
      setMessage("Ticket status updated");
      await loadTickets(page, appliedFilters);
      onChanged?.();
    } catch (err) {
      setMessage(err.message || "Unable to update ticket");
    } finally {
      setUpdatingId("");
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

  return (
    <section className="advanced-tickets">
      <div className="advanced-ticket-header">
        <div>
          <span>CRM TICKET WORKSPACE</span>
          <h1>Support Tickets</h1>
          <p>Search, filter, prioritize and manage live customer requests.</p>
        </div>
        <div className="ticket-result-count"><strong>{totalTickets}</strong><span>matching tickets</span></div>
      </div>

      <form className="ticket-filter-panel" onSubmit={applyFilters}>
        <div className="ticket-search-field">
          <label>Search</label>
          <input
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Title, description, reporter or assignee"
            maxLength={100}
          />
        </div>
        <div><label>Status</label><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="CLOSED">Closed</option><option value="BLOCKED">Blocked</option></select></div>
        <div><label>Priority</label><select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}><option value="">All</option>{[1,2,3,4,5].map((value) => <option key={value} value={value}>P{value}</option>)}</select></div>
        <div><label>Sort</label><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="priority">Highest priority</option></select></div>
        <div><label>From</label><input type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} /></div>
        <div><label>To</label><input type="date" value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} /></div>
        {canFilterAssignee && <div><label>Assignee</label><input value={filters.assignee} onChange={(event) => setFilters({ ...filters, assignee: event.target.value })} placeholder="Engineer user ID" /></div>}
        <div><label>Per page</label><select value={filters.limit} onChange={(event) => setFilters({ ...filters, limit: event.target.value })}><option value="6">6</option><option value="10">10</option><option value="20">20</option></select></div>
        <div className="ticket-filter-actions"><button className="apply-ticket-filter" type="submit">Apply Filters</button><button className="clear-ticket-filter" type="button" onClick={clearFilters}>Clear</button></div>
      </form>

      {message && <div className="advanced-ticket-message">{message}</div>}

      {loading ? (
        <div className="advanced-ticket-empty">Loading ticket workspace...</div>
      ) : tickets.length === 0 ? (
        <div className="advanced-ticket-empty"><strong>No tickets match these filters</strong><span>Clear filters or create a new support request.</span></div>
      ) : (
        <div className="advanced-ticket-grid">
          {tickets.map((ticket) => (
            <article className="advanced-ticket-card" key={ticket._id}>
              <div className="ticket-card-topline">
                <span className={`advanced-status ${(ticket.status || "").toLowerCase()}`}>{String(ticket.status || "OPEN").replace("_", " ")}</span>
                <span className={`advanced-priority p${ticket.ticketPriority || 5}`}>P{ticket.ticketPriority || "—"}</span>
              </div>
              <h3>{ticket.title}</h3>
              <p className="advanced-ticket-description">{ticket.description}</p>
              <div className="advanced-ticket-meta">
                <div><span>Reporter</span><strong>{ticket.reporter || "—"}</strong></div>
                <div><span>Assignee</span><strong>{ticket.assignee || "Unassigned"}</strong></div>
                <div><span>Created</span><strong>{formatDate(ticket.createdAt)}</strong></div>
              </div>

              <div className="advanced-ticket-actions">
                {canManageStatus && (
                  <select
                    value={ticket.status}
                    disabled={updatingId === ticket._id}
                    onChange={(event) => updateStatus(ticket, event.target.value)}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                )}
                <button type="button" onClick={() => onOpenTicket?.(ticket)}>Details & Activity</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="ticket-pagination">
        <button onClick={() => changePage(page - 1)} disabled={page <= 1 || loading}>← Previous</button>
        <span>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
        <button onClick={() => changePage(page + 1)} disabled={page >= totalPages || loading}>Next →</button>
      </div>
    </section>
  );
}

export default AdvancedTickets;
