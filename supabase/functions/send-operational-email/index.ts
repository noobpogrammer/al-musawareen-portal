import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const ALLOWED_NOTIFICATION_TYPES = [
  "assignment_created",
  "assignment_updated",
  "assignment_graded",
  "assignment_rating_updated",
  "miqaat_request",
  "sharaf_allocated",
  "sharaf_updated",
  "coverage_request_received",
  "registration_approved",
  "registration_rejected",
] as const;

type NotificationType = (typeof ALLOWED_NOTIFICATION_TYPES)[number];

type TemplateData = Record<string, string | number | boolean | null | undefined>;

interface OperationalEmailRequest {
  notificationType?: string;
  recipientItsNumbers?: string[];
  data?: TemplateData;
}

interface MemberRecipient {
  its_id: string;
  email: string | null;
  status: string | null;
  role: string | null;
  roles: unknown;
}

interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
}

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textValue(data: TemplateData, key: string, fallback = ""): string {
  const value = data[key];
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function baseTemplate(title: string, bodyHtml: string, bodyText: string): RenderedTemplate {
  const safeTitle = escapeHtml(title);

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FAF4E8;color:#3A1A14;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF4E8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFF9F2;border:1px solid rgba(92,19,15,.12);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#5C130F;padding:22px 28px;color:#FAF4E8;">
                <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#CE933E;font-weight:700;">Al Musawareen</div>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;font-weight:700;color:#FAF4E8;">${safeTitle}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.65;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid rgba(92,19,15,.10);font-size:12px;line-height:1.5;color:#6B4B43;">
                This is an automated operational notification from Al Musawareen.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject: title,
    html,
    text: `Al Musawareen\n\n${title}\n\n${bodyText}\n\nThis is an automated operational notification from Al Musawareen.`,
  };
}

function renderTemplate(type: NotificationType, data: TemplateData): RenderedTemplate {
  switch (type) {
    case "assignment_created":
      return baseTemplate(
        "New Al Musawareen Assignment",
        '<p style="margin:0;">You have a new assignment. Please check the portal.</p>',
        "You have a new assignment. Please check the portal.",
      );

    case "assignment_updated": {
      const assignment = textValue(data, "assignment", textValue(data, "miqaat", "your assignment"));
      const changeSummary = textValue(data, "changeSummary", "Assignment details were updated.");

      return baseTemplate(
        "Al Musawareen Assignment Updated",
        `<p style="margin:0 0 16px;">Your assignment <strong>${escapeHtml(assignment)}</strong> has been updated.</p>
         <p style="margin:0 0 16px;">${escapeHtml(changeSummary)}</p>
         <p style="margin:0;">Please check the portal.</p>`,
        `Your assignment ${assignment} has been updated.\n${changeSummary}\nPlease check the portal.`,
      );
    }

    case "assignment_graded":
      return baseTemplate(
        "Al Musawareen Assignment Reviewed",
        '<p style="margin:0;">Your assignment/submission has been reviewed. Please check the portal.</p>',
        "Your assignment/submission has been reviewed. Please check the portal.",
      );

    case "assignment_rating_updated":
      return baseTemplate(
        "Al Musawareen Rating Updated",
        '<p style="margin:0;">Your rating has been updated. Please check the portal.</p>',
        "Your rating has been updated. Please check the portal.",
      );

    case "miqaat_request": {
      const miqaat = textValue(data, "miqaat", "Miqaat");
      const date = textValue(data, "date", "Date to be confirmed");

      return baseTemplate(
        "New Miqaat Request — Al Musawareen",
        `<p style="margin:0 0 16px;">You have received a new Miqaat coverage request.</p>
         <p style="margin:0;"><strong>Miqaat:</strong> ${escapeHtml(miqaat)}<br>
         <strong>Date:</strong> ${escapeHtml(date)}</p>
         <p style="margin:16px 0 0;">Please sign in to the portal to accept or decline.</p>`,
        `You have received a new Miqaat coverage request.\nMiqaat: ${miqaat}\nDate: ${date}\nPlease sign in to the portal to accept or decline.`,
      );
    }

    case "sharaf_allocated": {
      const event = textValue(data, "event", "Sharaf allocation");
      const date = textValue(data, "date", "Date to be confirmed");
      const location = textValue(data, "location", "Location to be confirmed");

      return baseTemplate(
        "Sharaf Allocation — Al Musawareen",
        `<p style="margin:0 0 16px;">A Sharaf allocation has been assigned to you.</p>
         <p style="margin:0;"><strong>Event:</strong> ${escapeHtml(event)}<br>
         <strong>Date:</strong> ${escapeHtml(date)}<br>
         <strong>Location:</strong> ${escapeHtml(location)}</p>`,
        `A Sharaf allocation has been assigned to you.\nEvent: ${event}\nDate: ${date}\nLocation: ${location}`,
      );
    }

    case "sharaf_updated": {
      const event = textValue(data, "event", "Sharaf allocation");
      const changeSummary = textValue(data, "changeSummary", "The allocation details were updated.");

      return baseTemplate(
        "Sharaf Allocation Updated — Al Musawareen",
        `<p style="margin:0 0 16px;">Your Sharaf allocation for <strong>${escapeHtml(event)}</strong> has changed.</p>
         <p style="margin:0;">${escapeHtml(changeSummary)}</p>`,
        `Your Sharaf allocation for ${event} has changed.\n${changeSummary}`,
      );
    }

    case "coverage_request_received": {
      const organization = textValue(data, "organization", "Community organization");
      const event = textValue(data, "event", "Event / Miqaat");

      return baseTemplate(
        "New Event Coverage Request",
        `<p style="margin:0 0 16px;">A new external coverage request has been received.</p>
         <p style="margin:0;"><strong>Organization:</strong> ${escapeHtml(organization)}<br>
         <strong>Event / Miqaat:</strong> ${escapeHtml(event)}</p>`,
        `A new external coverage request has been received.\nOrganization: ${organization}\nEvent / Miqaat: ${event}`,
      );
    }

    case "registration_approved":
      return baseTemplate(
        "Your Al Musawareen Registration Has Been Approved",
        '<p style="margin:0;">Your registration has been approved. You can now sign in to the Al Musawareen portal.</p>',
        "Your registration has been approved. You can now sign in to the Al Musawareen portal.",
      );

    case "registration_rejected":
      return baseTemplate(
        "Al Musawareen Registration Update",
        '<p style="margin:0 0 16px;">Your Al Musawareen registration was not approved.</p><p style="margin:0;">For assistance, please contact the Al Musawareen administration.</p>',
        "Your Al Musawareen registration was not approved. For assistance, please contact the Al Musawareen administration.",
      );
  }
}

const OPERATIONAL_FROM = "Al Musawareen <admin@theelmserver.com>";
const MAX_RECIPIENTS = 50;

function normalizeItsNumbers(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => String(item ?? "").trim())
        .filter((item) => /^\d{8}$/.test(item)),
    ),
  ).slice(0, MAX_RECIPIENTS);
}

function memberHasRole(member: MemberRecipient, role: string): boolean {
  const roles = Array.isArray(member.roles)
    ? member.roles.map((item: unknown) => String(item))
    : [];

  return member.role === role || roles.includes(role);
}

async function sendWithSmtp(
  transporter: ReturnType<typeof nodemailer.createTransport>,
  recipientEmail: string,
  rendered: RenderedTemplate,
): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  try {
    const result = await transporter.sendMail({
      from: OPERATIONAL_FROM,
      to: recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return {
      ok: true,
      id: typeof result.messageId === "string" ? result.messageId : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP delivery failed";
    return { ok: false, error: message };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.titan.email";
  const smtpPort = Number(Deno.env.get("SMTP_PORT") || "587");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !supabaseServiceRoleKey ||
    !smtpUser ||
    !smtpPassword ||
    !Number.isInteger(smtpPort) ||
    smtpPort <= 0
  ) {
    console.error("Missing or invalid required Edge Function environment variables.");
    return json(500, { error: "Server configuration error" });
  }

  if (smtpUser.toLowerCase() !== "admin@theelmserver.com") {
    console.error("SMTP_USER does not match the approved operational sender.");
    return json(500, { error: "Server configuration error" });
  }

  const smtpTransport = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort === 587,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json(401, { error: "Authentication required" });
  }

  const accessToken = authorization.slice("Bearer ".length).trim();
  if (!accessToken) {
    return json(401, { error: "Authentication required" });
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser(accessToken);

  if (userError || !user) {
    return json(401, { error: "Invalid authentication" });
  }

  const { data: callerMember, error: memberError } = await adminClient
    .from("members")
    .select("its_id, email, status, role, roles")
    .eq("id", user.id)
    .maybeSingle();

  if (memberError) {
    console.error("Could not resolve caller authorization.");
    return json(500, { error: "Authorization check failed" });
  }

  if (
    !callerMember ||
    callerMember.status !== "approved" ||
    !memberHasRole(callerMember as MemberRecipient, "admin")
  ) {
    return json(403, { error: "Approved admin access required" });
  }

  let payload: OperationalEmailRequest;

  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const notificationType = payload.notificationType;

  if (
    !notificationType ||
    !ALLOWED_NOTIFICATION_TYPES.includes(notificationType as NotificationType)
  ) {
    return json(400, {
      error: "Invalid notification type",
      allowedNotificationTypes: ALLOWED_NOTIFICATION_TYPES,
    });
  }

  const typedNotificationType = notificationType as NotificationType;
  const data =
    payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? payload.data
      : {};

  const rendered = renderTemplate(typedNotificationType, data);

  let recipients: MemberRecipient[] = [];

  if (typedNotificationType === "coverage_request_received") {
    const { data: adminRecipients, error: adminRecipientError } = await adminClient
      .from("members")
      .select("its_id, email, status, role, roles")
      .eq("status", "approved");

    if (adminRecipientError) {
      console.error("Could not resolve admin notification recipients.");
      return json(500, { error: "Recipient resolution failed" });
    }

    recipients = (adminRecipients || [])
      .filter((member) => memberHasRole(member as MemberRecipient, "admin"))
      .slice(0, MAX_RECIPIENTS) as MemberRecipient[];
  } else {
    const itsNumbers = normalizeItsNumbers(payload.recipientItsNumbers);

    if (itsNumbers.length === 0) {
      return json(400, {
        error: "At least one valid 8-digit recipient ITS number is required",
      });
    }

    const { data: memberRecipients, error: recipientError } = await adminClient
      .from("members")
      .select("its_id, email, status, role, roles")
      .in("its_id", itsNumbers);

    if (recipientError) {
      console.error("Could not resolve operational email recipients.");
      return json(500, { error: "Recipient resolution failed" });
    }

    recipients = (memberRecipients || []) as MemberRecipient[];

    const registrationNotification =
      typedNotificationType === "registration_approved" ||
      typedNotificationType === "registration_rejected";

    if (!registrationNotification) {
      recipients = recipients.filter((member) => member.status === "approved");
    }
  }

  const deliverableRecipients = recipients.filter(
    (member) => typeof member.email === "string" && member.email.trim().length > 0,
  );

  if (deliverableRecipients.length === 0) {
    return json(422, { error: "No deliverable member email addresses were found" });
  }

  const deliveries = await Promise.all(
    deliverableRecipients.map(async (member) => {
      const result = await sendWithSmtp(smtpTransport, member.email!.trim(), rendered);
      return {
        itsNumber: member.its_id,
        ...result,
      };
    }),
  );

  const succeeded = deliveries.filter((delivery) => delivery.ok);
  const failed = deliveries.filter((delivery) => !delivery.ok);

  if (failed.length > 0) {
    console.error("One or more operational emails failed to send.", {
      notificationType: typedNotificationType,
      attempted: deliveries.length,
      failed: failed.length,
    });
  }

  return json(failed.length > 0 ? 207 : 200, {
    ok: failed.length === 0,
    notificationType: typedNotificationType,
    attempted: deliveries.length,
    sent: succeeded.length,
    failed: failed.length,
    deliveryIds: succeeded
      .map((delivery) => ("id" in delivery ? delivery.id : null))
      .filter(Boolean),
  });
});
