import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const ALLOWED_NOTIFICATION_TYPES = [
  "assignment_created",
  "assignment_updated",
  "assignment_graded",
  "assignment_rating_updated",
  "assignment_response_admin",
  "miqaat_request",
  "sharaf_allocated",
  "sharaf_updated",
  "coverage_request_received",
  "registration_pending_admin",
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
  full_name: string | null;
  email: string | null;
  status: string | null;
  role: string | null;
  roles: unknown;
  hr_permissions: Record<string, unknown> | null;
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

    case "assignment_response_admin": {
      const memberName = textValue(data, "memberName", "A team member");
      const assignment = textValue(data, "assignment", "an assignment");
      const response = textValue(data, "response", "responded");

      return baseTemplate(
        "Assignment Response — Al Musawareen",
        `<p style="margin:0;"><strong>${escapeHtml(memberName)}</strong> has <strong>${escapeHtml(response)}</strong> ${escapeHtml(assignment)}. Please check the portal.</p>`,
        `${memberName} has ${response} ${assignment}. Please check the portal.`,
      );
    }

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

    case "registration_pending_admin": {
      const memberName = textValue(data, "memberName", "A new member");
      const itsNumber = textValue(data, "itsNumber", "");

      return baseTemplate(
        "New Al Musawareen Registration Awaiting Approval",
        `<p style="margin:0 0 16px;">A new member has registered and is waiting for approval.</p>
         <p style="margin:0;"><strong>Name:</strong> ${escapeHtml(memberName)}<br>
         <strong>ITS ID:</strong> ${escapeHtml(itsNumber)}</p>
         <p style="margin:16px 0 0;">Please check the Al Musawareen portal to review the registration.</p>`,
        `A new member has registered and is waiting for approval.\nName: ${memberName}\nITS ID: ${itsNumber}\nPlease check the Al Musawareen portal to review the registration.`,
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

function canApproveOnboarding(member: MemberRecipient): boolean {
  return memberHasRole(member, "admin") ||
    (memberHasRole(member, "coordinator") && member.hr_permissions?.approveOnboarding === true);
}

function dedupeRecipients(members: MemberRecipient[]): MemberRecipient[] {
  const seen = new Set<string>();

  return members.filter((member) => {
    const key = (member.email || "").trim().toLowerCase() || member.its_id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function recipientSummary(members: MemberRecipient[]): string {
  const names = members
    .map((member) => member.full_name?.trim() || member.its_id)
    .filter(Boolean);

  return names.length > 0 ? names.join(", ") : "the affected member";
}

function renderAdminCopy(
  type: NotificationType,
  data: TemplateData,
  affectedMembers: MemberRecipient[],
): RenderedTemplate {
  const affected = recipientSummary(affectedMembers);

  switch (type) {
    case "assignment_created":
      return baseTemplate(
        "Assignment Created — Al Musawareen",
        `<p style="margin:0;">A new assignment has been created for <strong>${escapeHtml(affected)}</strong>. Please check the portal.</p>`,
        `A new assignment has been created for ${affected}. Please check the portal.`,
      );

    case "assignment_updated": {
      const assignment = textValue(data, "assignment", textValue(data, "miqaat", "an assignment"));
      const changeSummary = textValue(data, "changeSummary", "Assignment details were updated.");
      return baseTemplate(
        "Assignment Updated — Al Musawareen",
        `<p style="margin:0 0 16px;">${escapeHtml(assignment)} was updated for <strong>${escapeHtml(affected)}</strong>.</p>
         <p style="margin:0 0 16px;">${escapeHtml(changeSummary)}</p>
         <p style="margin:0;">Please check the portal.</p>`,
        `${assignment} was updated for ${affected}.\n${changeSummary}\nPlease check the portal.`,
      );
    }

    case "assignment_graded":
      return baseTemplate(
        "Assignment Reviewed — Al Musawareen",
        `<p style="margin:0;">The assignment/submission for <strong>${escapeHtml(affected)}</strong> has been reviewed. Please check the portal.</p>`,
        `The assignment/submission for ${affected} has been reviewed. Please check the portal.`,
      );

    case "assignment_rating_updated":
      return baseTemplate(
        "Member Rating Updated — Al Musawareen",
        `<p style="margin:0;">The rating for <strong>${escapeHtml(affected)}</strong> has been updated. Please check the portal.</p>`,
        `The rating for ${affected} has been updated. Please check the portal.`,
      );

    case "miqaat_request": {
      const miqaat = textValue(data, "miqaat", "Miqaat");
      return baseTemplate(
        "Miqaat Request Sent — Al Musawareen",
        `<p style="margin:0;">A Miqaat request for <strong>${escapeHtml(miqaat)}</strong> was sent to <strong>${escapeHtml(affected)}</strong>. Please check the portal.</p>`,
        `A Miqaat request for ${miqaat} was sent to ${affected}. Please check the portal.`,
      );
    }

    case "sharaf_allocated":
      return baseTemplate(
        "Sharaf Allocation Created — Al Musawareen",
        `<p style="margin:0;">A Sharaf allocation was created for <strong>${escapeHtml(affected)}</strong>. Please check the portal.</p>`,
        `A Sharaf allocation was created for ${affected}. Please check the portal.`,
      );

    case "sharaf_updated":
      return baseTemplate(
        "Sharaf Allocation Updated — Al Musawareen",
        `<p style="margin:0;">A Sharaf allocation was updated for <strong>${escapeHtml(affected)}</strong>. Please check the portal.</p>`,
        `A Sharaf allocation was updated for ${affected}. Please check the portal.`,
      );

    case "registration_approved":
      return baseTemplate(
        "Registration Approved — Al Musawareen",
        `<p style="margin:0;">The registration for <strong>${escapeHtml(affected)}</strong> has been approved.</p>`,
        `The registration for ${affected} has been approved.`,
      );

    case "registration_rejected":
      return baseTemplate(
        "Registration Rejected — Al Musawareen",
        `<p style="margin:0;">The registration for <strong>${escapeHtml(affected)}</strong> was not approved.</p>`,
        `The registration for ${affected} was not approved.`,
      );

    default:
      return renderTemplate(type, data);
  }
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
    .select("its_id, full_name, email, status, role, roles, hr_permissions")
    .eq("id", user.id)
    .maybeSingle();

  if (memberError) {
    console.error("Could not resolve caller authorization.");
    return json(500, { error: "Authorization check failed" });
  }

  if (!callerMember) {
    return json(403, { error: "Member profile required" });
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
  let data: TemplateData =
    payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? payload.data
      : {};

  const caller = callerMember as MemberRecipient;
  const isApprovedAdmin =
    caller.status === "approved" && memberHasRole(caller, "admin");

  const memberCallableType =
    typedNotificationType === "assignment_response_admin" ||
    typedNotificationType === "registration_pending_admin";

  if (!isApprovedAdmin && !memberCallableType) {
    return json(403, { error: "Approved admin access required" });
  }

  let affectedRecipients: MemberRecipient[] = [];
  let adminRecipients: MemberRecipient[] = [];

  const { data: approvedStaff, error: staffError } = await adminClient
    .from("members")
    .select("its_id, full_name, email, status, role, roles, hr_permissions")
    .eq("status", "approved");

  if (staffError) {
    console.error("Could not resolve staff notification recipients.");
    return json(500, { error: "Recipient resolution failed" });
  }

  const approvedStaffMembers = (approvedStaff || []) as MemberRecipient[];
  const approvedAdmins = approvedStaffMembers.filter((member) => memberHasRole(member, "admin"));

  if (typedNotificationType === "registration_pending_admin") {
    if (caller.status !== "pending") {
      return json(403, { error: "Only a pending registrant can send this notification" });
    }

    data = {
      memberName: caller.full_name || "New member",
      itsNumber: caller.its_id,
    };

    adminRecipients = approvedStaffMembers.filter(canApproveOnboarding);
  } else if (typedNotificationType === "assignment_response_admin") {
    if (caller.status !== "approved") {
      return json(403, { error: "Approved member access required" });
    }

    const assignmentId = textValue(data, "assignmentId");
    if (!assignmentId) {
      return json(400, { error: "assignmentId is required" });
    }

    const { data: assignment, error: assignmentError } = await adminClient
      .from("assignments")
      .select("id, miqaat_name, assigned_users, member_statuses")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return json(404, { error: "Assignment not found" });
    }

    const assignedUsers = Array.isArray(assignment.assigned_users)
      ? assignment.assigned_users.map((item: unknown) => String(item))
      : [];
    const memberStatuses =
      assignment.member_statuses && typeof assignment.member_statuses === "object"
        ? assignment.member_statuses as Record<string, unknown>
        : {};

    if (!assignedUsers.includes(caller.its_id)) {
      return json(403, { error: "Caller is not assigned to this assignment" });
    }

    const response = String(memberStatuses[caller.its_id] || "");
    if (response !== "accepted" && response !== "declined") {
      return json(409, { error: "No accepted or declined response is recorded" });
    }

    data = {
      memberName: caller.full_name || caller.its_id,
      assignment: assignment.miqaat_name || "the assignment",
      response,
    };

    adminRecipients = approvedAdmins;
  } else if (typedNotificationType === "coverage_request_received") {
    adminRecipients = approvedAdmins;
  } else {
    const itsNumbers = normalizeItsNumbers(payload.recipientItsNumbers);

    if (itsNumbers.length === 0) {
      return json(400, {
        error: "At least one valid 8-digit recipient ITS number is required",
      });
    }

    const { data: memberRecipients, error: recipientError } = await adminClient
      .from("members")
      .select("its_id, full_name, email, status, role, roles, hr_permissions")
      .in("its_id", itsNumbers);

    if (recipientError) {
      console.error("Could not resolve operational email recipients.");
      return json(500, { error: "Recipient resolution failed" });
    }

    affectedRecipients = (memberRecipients || []) as MemberRecipient[];

    const registrationNotification =
      typedNotificationType === "registration_approved" ||
      typedNotificationType === "registration_rejected";

    if (!registrationNotification) {
      affectedRecipients = affectedRecipients.filter((member) => member.status === "approved");
    }

    adminRecipients = approvedAdmins;
  }

  affectedRecipients = dedupeRecipients(affectedRecipients);
  adminRecipients = dedupeRecipients(adminRecipients);

  const affectedDeliverable = affectedRecipients.filter(
    (member) => typeof member.email === "string" && member.email.trim().length > 0,
  );
  const adminDeliverable = adminRecipients.filter(
    (member) => typeof member.email === "string" && member.email.trim().length > 0,
  );

  if (affectedDeliverable.length === 0 && adminDeliverable.length === 0) {
    return json(422, { error: "No deliverable member email addresses were found" });
  }

  const memberTemplate = renderTemplate(typedNotificationType, data);
  const adminTemplate =
    typedNotificationType === "registration_pending_admin" ||
    typedNotificationType === "assignment_response_admin" ||
    typedNotificationType === "coverage_request_received"
      ? memberTemplate
      : renderAdminCopy(typedNotificationType, data, affectedDeliverable);

  const deliveryTargets = [
    ...affectedDeliverable.map((member) => ({ member, rendered: memberTemplate, audience: "member" as const })),
    ...adminDeliverable.map((member) => ({ member, rendered: adminTemplate, audience: "admin" as const })),
  ].filter((target, index, all) => {
    const email = target.member.email!.trim().toLowerCase();
    return all.findIndex((candidate) => candidate.member.email!.trim().toLowerCase() === email) === index;
  });

  const deliveries = await Promise.all(
    deliveryTargets.map(async ({ member, rendered, audience }) => {
      const result = await sendWithSmtp(smtpTransport, member.email!.trim(), rendered);
      return {
        itsNumber: member.its_id,
        audience,
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
