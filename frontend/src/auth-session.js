const originalFetch = window.fetch.bind(window);

const pendingSessionMessage = sessionStorage.getItem("crmSessionMessage");
if (pendingSessionMessage) {
  sessionStorage.removeItem("crmSessionMessage");
  window.setTimeout(() => {
    const toast = document.createElement("div");
    toast.textContent = pendingSessionMessage;
    toast.setAttribute("role", "status");
    Object.assign(toast.style, {
      position: "fixed",
      top: "18px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "99999",
      maxWidth: "560px",
      width: "calc(100% - 32px)",
      padding: "13px 16px",
      border: "1px solid rgba(45, 212, 191, .45)",
      borderRadius: "12px",
      background: "#0b1f33",
      color: "#dffcf7",
      boxShadow: "0 18px 50px rgba(0,0,0,.35)",
      font: "600 14px/1.45 Inter, system-ui, sans-serif",
      textAlign: "center"
    });
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 6500);
  }, 350);
}

window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  try {
    const request = args[0];
    const url = typeof request === "string" ? request : request?.url || "";
    const isCrmApi = url.includes("/crm/api/v1/");
    const isSignin = url.includes("/auth/signin");

    if (isCrmApi && !isSignin && response.status === 401) {
      localStorage.removeItem("crmToken");
      localStorage.removeItem("crmUser");
      sessionStorage.setItem(
        "crmSessionMessage",
        "Your session expired after a security update. Please sign in again."
      );

      setTimeout(() => {
        window.location.reload();
      }, 150);
    }
  } catch {
    // Never block the original API response if session cleanup itself fails.
  }

  return response;
};
