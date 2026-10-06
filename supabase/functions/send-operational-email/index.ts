import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_NOTIFICATION_TYPES = [
  "assignment_created",
  "assignment_updated",
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
  data?: TemplateData;
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
    case "assignment_created": {
      const miqaat = textValue(data, "miqaat", "Coverage assignment");
      const date = textValue(data, "date", "Date to be confirmed");
      const location = textValue(data, "location", "Location to be confirmed");

      return baseTemplate(
        "New Al Musawareen Assignment",
        `<p style="margin:0 0 16px;">You have received a new coverage assignment.</p>
         <p style="margin:0;"><strong>Miqaat:</strong> ${escapeHtml(miqaat)}<br>
         <strong>Date:</strong> ${escapeHtml(date)}<br>
         <strong>Location:</strong> ${escapeHtml(location)}</p>`,
        `You have received a new coverage assignment.\nMiqaat: ${miqaat}\nDate: ${date}\nLocation: ${location}`,
      );
    }

    case "assignment_updated": {
      const miqaat = textValue(data, "miqaat", "Coverage assignment");
      const changeSummary = textValue(data, "changeSummary", "Assignment details were updated.");

      return baseTemplate(
        "Al Musawareen Assignment Updated",
        `<p style="margin:0 0 16px;">Your assignment for <strong>${escapeHtml(miqaat)}</strong> has been updated.</p>
         <p style="margin:0;">${escapeHtml(changeSummary)}</p>`,
        `Your assignment for ${miqaat} has been updated.\n${changeSummary}`,
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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing built-in Supabase Edge Function environment variables.");
    return json(500, { error: "Server configuration error" });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json(401, { error: "Authentication required" });
  }

  const accessToken = authorization.slice("Bearer ".length).trim();
  if (!accessToken) {
    return json(401, { error: "Authentication required" });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return json(401, { error: "Invalid authentication" });
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("role, roles, status")
    .eq("id", user.id)
    .maybeSingle();

  if (memberError) {
    console.error("Could not resolve caller authorization.");
    return json(500, { error: "Authorization check failed" });
  }

  const roles = Array.isArray(member?.roles)
    ? member.roles.map((role: unknown) => String(role))
    : [];

  const isAdmin = member?.role === "admin" || roles.includes("admin");

  if (!member || !isAdmin) {
    return json(403, { error: "Admin access required" });
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

  const data =
    payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? payload.data
      : {};

  const rendered = renderTemplate(notificationType as NotificationType, data);

  // Phase 4A foundation only:
  // - no arbitrary recipients
  // - no raw subject/html accepted from callers
  // - no provider credentials in source control
  // - no email is sent yet
  //
  // A later, separately approved update will resolve recipients server-side
  // and connect the rendered template to a transactional email provider.

  return json(200, {
    ok: true,
    mode: "validation_only",
    notificationType,
    template: {
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    },
  });
});
