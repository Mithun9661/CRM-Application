import { useEffect, useMemo, useState } from "react";
import "./ticket-details.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7777/crm/api/v1";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

function TicketDetails({ ticket, onClose, onChanged }) {
  const [details, setDetails] = useState(ticket || null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(ticket?.status || "OPEN");
  const [assignee, setAssignee] = useState(ticket?.assignee || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("crmToken");
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("crmUser") || "{}"); } catch { return {}; }
  }, []);
  const canAssign = ["ADMIN", "SUPER_ADMIN"].includes(currentUser?.userType);

  const loadEngineers = async (ticketData) => {
    if (!canAssign || !token) return;
    try {
      const response = await fetch(`${API_URL}/users?userType=ENGINEER&userStatus=APPROVED`, {
        headers: { "x-access-token": token }
      });
      const data = await response.json();
      if (!response.ok) return;
      const list = Array.isArray(data) ? data : data.users || data.data || [];
      const ticketCompany = String(ticketData?.companyId || "");
      setEngineers(list.filter((item) => String(item.companyId || "") === ticketCompany));
    } catch {
      setEngineers([]);
    }
  };

  const loadAll = async () => {
    if (!ticket?._id || !token) return;
    setLoading(true);
    setMessage("");
    try {
      const headers = { "x-access-token": token };
      const [ticketResponse, commentsResponse, historyResponse] = await Promise.all([
        fetch(`${API_URL}/tickets/${ticket._id}`, { headers }),
        fetch(`${API_URL}/tickets/${ticket._id}/comments`, { headers }),
        fetch(`${API_URL}/tickets/${ticket._id}/history`, { headers })
      ]);

      const [ticketData, commentsData, historyData] = await Promise.all([
        ticketResponse.json(),
        commentsResponse.json(),
        historyResponse.json()
      ]);

      if (!ticketResponse.ok) throw new Error(ticketData.message || "Unable to load ticket");
      if (!commentsResponse.ok) throw new Error(commentsData.message || "Unable to load comments");
      if (!historyResponse.ok) throw new Error(historyData.message || "Unable to load history");

      setDetails(ticketData);
      setStatus(ticketData.status || "OPEN");
      setAssignee(ticketData.assignee || "");
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setHistory(Array.isArray(historyData) ? historyData.slice().reverse() : []);
      await loadEngineers(ticketData);
    } catch (err) {
      setMessage(err.message || "Unable to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [ticket?._id]);

  const updateStatus = async () => {
    if (!details || status === details.status) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/tickets/${details._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Status update failed");
      setMessage("Ticket status updated successfully");
      await loadAll();
      if (onChanged) onChanged();
    } catch (err) {
      setMessage(err.message || "Status update failed");
    } finally {
      setSaving(false);
    }
  };

  const updateAssignee = async () => {
    if (!details || assignee === (details.assignee || "")) return;
    setAssigning(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/tickets/${details._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token
        },
        body: JSON.stringify({ assignee })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Engineer assignment failed");
      setMessage(assignee ? `Ticket assigned to ${assignee}` : "Ticket unassigned");
      await loadAll();
      if (onChanged) onChanged();
    } catch (err) {
      setMessage(err.message || "Engineer assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    const content = comment.trim();
    if (!content) return;
    setPosting(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/tickets/${details._id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token
        },
        body: JSON.stringify({ content })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to add comment");
      setComment("");
      await loadAll();
      if (onChanged) onChanged();
    } catch (err) {
      setMessage(err.message || "Unable to add comment");
    } finally {
      setPosting(false);
    }
  };

  if (!ticket) return null;

  return (
    <div className="ticket-detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="ticket-detail-modal">
        <div className="ticket-detail-header">
          <div>
            <span className="ticket-detail-kicker">TICKET DETAILS</span>
            <h2>{details?.title || ticket.title || "Support Ticket"}</h2>
            <p>#{String(ticket._id || "").slice(-8).toUpperCase()}</p>
          </div>
          <button className="ticket-detail-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {message && <div className="ticket-detail-message">{message}</div>}

        {loading ? (
          <div className="ticket-detail-loading">Loading ticket activity...</div>
        ) : (
          <div className="ticket-detail-body">
            <section className="ticket-overview-panel">
              <div className="ticket-overview-top">
                <div className="ticket-meta-block"><span>Status</span><strong className={`detail-status ${(details?.status || "").toLowerCase()}`}>{(details?.status || "OPEN").replace("_", " ")}</strong></div>
                <div className="ticket-meta-block"><span>Priority</span><strong>P{details?.ticketPriority || "—"}</strong></div>
                <div className="ticket-meta-block"><span>Reporter</span><strong>{details?.reporter || "—"}</strong></div>
                <div className="ticket-meta-block"><span>Assignee</span><strong>{details?.assignee || "Unassigned"}</strong></div>
              </div>

              <div className="ticket-description-box">
                <span>Description</span>
                <p>{details?.description || "No description available."}</p>
              </div>

              <div className="ticket-admin-controls">
                <div className="ticket-status-editor">
                  <div><span>Update status</span><small>Move this request through the support workflow.</small></div>
                  <div className="ticket-status-controls">
                    <select value={status} onChange={(event) => setStatus(event.target.value)}>
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                    <button onClick={updateStatus} disabled={saving || status === details?.status}>{saving ? "Updating..." : "Save Status"}</button>
                  </div>
                </div>

                {canAssign && (
                  <div className="ticket-status-editor assignment-editor">
                    <div><span>Assign engineer</span><small>Route this ticket to an approved engineer in the same company.</small></div>
                    <div className="ticket-status-controls">
                      <select value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                        <option value="">Unassigned</option>
                        {engineers.map((engineer) => <option key={engineer.userId} value={engineer.userId}>{engineer.name || engineer.userId} ({engineer.userId})</option>)}
                      </select>
                      <button onClick={updateAssignee} disabled={assigning || assignee === (details?.assignee || "")}>{assigning ? "Assigning..." : "Save Assignee"}</button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="ticket-collaboration-grid">
              <section className="ticket-comments-panel">
                <div className="detail-panel-heading"><div><span>COLLABORATION</span><h3>Comments</h3></div><b>{comments.length}</b></div>
                <div className="comment-list">
                  {comments.length === 0 ? (
                    <div className="ticket-detail-empty">No comments yet. Start the conversation below.</div>
                  ) : comments.map((item) => {
                    const commenter = item.commenterId || {};
                    return (
                      <article className="comment-item" key={item._id}>
                        <div className="comment-avatar">{String(commenter.name || commenter.userId || "U").charAt(0).toUpperCase()}</div>
                        <div><div className="comment-head"><strong>{commenter.name || commenter.userId || "User"}</strong><span>{commenter.userType || "USER"}</span><time>{formatDateTime(item.createdAt)}</time></div><p>{item.content}</p></div>
                      </article>
                    );
                  })}
                </div>
                <form className="comment-form" onSubmit={addComment}>
                  <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Add an internal note or customer update..." />
                  <div><small>{comment.length}/2000</small><button disabled={posting || !comment.trim()}>{posting ? "Posting..." : "Add Comment"}</button></div>
                </form>
              </section>

              <section className="ticket-history-panel">
                <div className="detail-panel-heading"><div><span>AUDIT TRAIL</span><h3>Ticket History</h3></div><b>{history.length}</b></div>
                <div className="history-timeline">
                  {history.length === 0 ? (
                    <div className="ticket-detail-empty">No history recorded yet.</div>
                  ) : history.map((item, index) => (
                    <article className="history-item" key={`${item.timestamp || index}-${index}`}>
                      <div className="history-marker"></div>
                      <div><div className="history-head"><strong>{String(item.action || "UPDATED").replaceAll("_", " ")}</strong><time>{formatDateTime(item.timestamp)}</time></div><p>By {item.updatedBy || "System"}</p>{item.action === "COMMENT_ADDED" && item.newValue?.content ? <small>“{item.newValue.content}”</small> : null}</div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="ticket-detail-footer"><span>Created {formatDateTime(details?.createdAt)}</span><span>Last updated {formatDateTime(details?.updatedAt)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketDetails;
