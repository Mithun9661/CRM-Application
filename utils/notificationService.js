const Notification = require("../Models/notification.model");
const User = require("../Models/user.model");
const transporter = require("../configs/mailer");

const resendConfigured = Boolean(process.env.RESEND_API_KEY);
const smtpConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

if (resendConfigured) {
  console.log("[email] Resend HTTPS notifications enabled");
} else if (smtpConfigured) {
  console.log("[email] SMTP notifications enabled");
} else {
  console.warn("[email] No email provider configured - email notifications disabled");
}

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;");

const isPlaceholderEmail = (email = "") => /\.example$/i.test(String(email).split("@")[1] || "");

const buildEmailContent = ({ title, message, ticketId, frontendUrl }) => {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const ticketReference = ticketId ? escapeHtml(String(ticketId)) : "";

  return {
    subject: `[EnterpriseFlow CRM] ${title}`,
    text: `${title}\n\n${message}${ticketId ? `\n\nTicket ID: ${ticketId}` : ""}\n\nOpen CRM: ${frontendUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033">
        <h2 style="margin-bottom:8px">${safeTitle}</h2>
        <p style="line-height:1.6">${safeMessage}</p>
        ${ticketReference ? `<p><strong>Ticket ID:</strong> ${ticketReference}</p>` : ""}
        <p style="margin-top:24px">
          <a href="${frontendUrl}" style="display:inline-block;padding:11px 18px;background:#5b5df0;color:white;text-decoration:none;border-radius:8px">Open EnterpriseFlow CRM</a>
        </p>
        <p style="margin-top:28px;font-size:12px;color:#667085">This is an automated CRM notification.</p>
      </div>
    `
  };
};

const sendViaResend = async ({ to, subject, text, html }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "EnterpriseFlow CRM <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`);
  }
};

const sendEmailNotifications = async ({ recipients, title, message, ticketId }) => {
  if (!resendConfigured && !smtpConfigured) return;

  const users = await User.find({
    userId: { $in: recipients },
    email: { $exists: true, $ne: "" }
  }).select("userId name email");

  if (!users.length) return;

  const frontendUrl = String(
    process.env.CRM_FRONTEND_URL || "https://crm-application-vert.vercel.app"
  ).replace(/\/$/, "");
  const content = buildEmailContent({ title, message, ticketId, frontendUrl });

  const deliverableUsers = users.filter((user) => {
    if (isPlaceholderEmail(user.email)) {
      console.warn(`[email] Skipping placeholder address for ${user.userId}`);
      return false;
    }
    return true;
  });

  const results = await Promise.allSettled(
    deliverableUsers.map((user) => {
      if (resendConfigured) {
        return sendViaResend({
          to: user.email,
          subject: content.subject,
          text: content.text,
          html: content.html
        });
      }

      return transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: user.email,
        subject: content.subject,
        text: content.text,
        html: content.html
      });
    })
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`[email] Failed for ${deliverableUsers[index].userId}:`, result.reason?.message || result.reason);
    } else {
      console.log(`[email] Notification sent to ${deliverableUsers[index].userId}`);
    }
  });
};

const notifyUsers = async ({ recipients, companyId = null, ticketId = null, type, title, message, createdBy = "SYSTEM" }) => {
  try {
    const uniqueRecipients = [...new Set((recipients || []).filter(Boolean))];
    if (!uniqueRecipients.length) return;

    await Notification.insertMany(
      uniqueRecipients.map((recipientUserId) => ({
        recipientUserId,
        companyId,
        ticketId,
        type,
        title,
        message,
        createdBy
      })),
      { ordered: false }
    );

    try {
      const emailRecipients = [...uniqueRecipients];
      if (title === "New ticket assigned" && createdBy && createdBy !== "SYSTEM") {
        emailRecipients.push(createdBy);
      }

      await sendEmailNotifications({
        recipients: [...new Set(emailRecipients)],
        title,
        message,
        ticketId
      });
    } catch (emailError) {
      // Email delivery must never break ticket/comment workflows.
      console.error("Email notification failed:", emailError.message);
    }
  } catch (err) {
    // Notifications must never break the main CRM workflow.
    console.error("Notification creation failed:", err.message);
  }
};

module.exports = { notifyUsers };
