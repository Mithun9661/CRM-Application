const originalFetch = window.fetch.bind(window);

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
        "Your session expired after a server security update. Please sign in again."
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
