const ANALYTICS_KEY = "demonoshowrecoverybriefs_analytics_events";
const INTENTS_KEY = "demonoshowrecoverybriefs_purchase_intents";
const ISSUE_BASE = "https://github.com/ert93333-ops/demo-no-show-recovery-briefs/issues/new";

const fields = {
  notes: document.querySelector("#no-show-notes"),
  meeting: document.querySelector("#meeting-context"),
  intent: document.querySelector("#buyer-intent"),
  pain: document.querySelector("#pain-notes"),
  timing: document.querySelector("#timing-notes"),
  reminder: document.querySelector("#reminder-notes"),
  stakeholder: document.querySelector("#stakeholder-notes"),
  reschedule: document.querySelector("#reschedule-notes"),
  cadence: document.querySelector("#cadence-notes"),
  draft: document.querySelector("#recovery-draft"),
};

const outputPanel = document.querySelector("#output-panel");
const briefOutput = document.querySelector("#brief-output");
const outputStatus = document.querySelector("#output-status");
const workflowError = document.querySelector("#workflow-error");
const copyButton = document.querySelector("#copy-brief");
const copyStatus = document.querySelector("#copy-status");
const sampleButton = document.querySelector("#sample-button");
const generateButton = document.querySelector("#generate-button");
const intentForm = document.querySelector("#intent-form");
const remoteIntent = document.querySelector("#remote-intent");
const remoteIntentLink = document.querySelector("#remote-intent-link");
const copyRemoteIntent = document.querySelector("#copy-remote-intent");
const remoteCopyStatus = document.querySelector("#remote-copy-status");
const intentStatus = document.querySelector("#intent-status");
let selectedPlan = "Starter";
let latestBriefText = "";
let latestRemoteText = "";

function track(event, detail = {}) {
  const params = new URLSearchParams(window.location.search);
  const payload = {
    event,
    detail,
    attribution: {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
    },
    page: window.location.pathname,
    referrer: document.referrer || "",
    experiment_id: "demo-no-show-recovery-briefs-v0",
    variant: "static-browser-local",
    timestamp: new Date().toISOString(),
  };
  const events = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || "[]");
  events.push(payload);
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events.slice(-200)));
}

function includesAny(text, terms) {
  return terms.some((term) => term.test(text));
}

function valueOf(field) {
  return field ? field.value.trim() : "";
}

function collectInput() {
  const input = {
    notes: valueOf(fields.notes),
    meeting: valueOf(fields.meeting),
    intent: valueOf(fields.intent),
    pain: valueOf(fields.pain),
    timing: valueOf(fields.timing),
    reminder: valueOf(fields.reminder),
    stakeholder: valueOf(fields.stakeholder),
    reschedule: valueOf(fields.reschedule),
    cadence: valueOf(fields.cadence),
    draft: valueOf(fields.draft),
  };
  input.all = Object.values(input).join("\n").toLowerCase();
  return input;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function addFinding(findings, title, message) {
  findings.push({ title, message });
}

function analyze(input) {
  const all = input.all;
  const findings = [];
  if (!includesAny(all, [/demo|discovery|meeting|call|booked|calendar|calendly|inbound|outbound|referral|website|pricing|form|campaign|qualified|qualification|source/i])) {
    addFinding(findings, "missing meeting source, qualification source, or booking context:", "Add where the demo came from and why the meeting was booked.");
  }
  if (!includesAny(all, [/intent|requested|looking|evaluating|wanted|need|goal|reason|booked because|interested|trying to|asked about|explore/i])) {
    addFinding(findings, "missing buyer intent, requested outcome, or original reason for booking:", "Recover the original reason the buyer agreed to meet.");
  }
  if (!includesAny(all, [/pain|manual|spreadsheet|save|reduce|increase|pipeline|conversion|revenue|risk|cost|challenge|outcome|value|roi|growth|problem|priority/i])) {
    addFinding(findings, "missing buyer pain, value hook, or problem statement:", "Tie the reschedule ask to one business problem instead of just the missed meeting.");
  }
  if (!includesAny(all, [/no-show|no show|missed|today|yesterday|minutes|hours|within|after|1 hour|24 hours|same day|follow-up|follow up|window|timezone|time zone/i])) {
    addFinding(findings, "missing no-show timing and follow-up window:", "Record when the no-show happened so the recovery note is timely and not stale.");
  }
  if (!includesAny(all, [/reminder|calendar invite|confirmed|confirmation|email reminder|sms|text reminder|timezone|reschedule link|prior touch|sent invite|accepted/i])) {
    addFinding(findings, "missing prior reminder or attendance context:", "Note whether the buyer had a reminder, accepted the invite, or may have hit a timezone issue.");
  }
  if (!includesAny(all, [/founder|ceo|vp|director|manager|ae|sdr|ops|revops|marketing|sales|team|company|account|stakeholder|champion|buyer|role|segment|industry/i])) {
    addFinding(findings, "missing stakeholder, role, company segment, or account context:", "Add who missed the meeting and whether another stakeholder should be looped in.");
  }
  if (!includesAny(all, [/reschedule|calendar|book|pick a time|link|reply|next step|cta|call|meeting|15 minutes|open time|available/i])) {
    addFinding(findings, "missing easy reschedule CTA or next step:", "Make the next step specific, low-friction, and calendar-safe.");
  }
  if (!includesAny(all, [/owner|ae|sdr|rep|follow-up|follow up|touch|cadence|stop|close loop|no response|sequence|next|tomorrow|later|final touch/i])) {
    addFinding(findings, "missing owner, next follow-up cadence, or stop condition:", "Decide who owns the recovery and when to stop following up.");
  }
  if (includesAny(all, [/you missed|wasted|last chance|final chance|only today|lose access|you must|urgent!!!|why didn't|unprofessional|penalty|blacklist|guarantee|guaranteed|must attend|shame/i])) {
    addFinding(findings, "pushy, guilt-heavy, spammy, fake-urgency, or unsupported claim risk:", "Remove blame, guilt, threats, fake urgency, and unsupported promises.");
  }
  if (includesAny(all, [/crm export|salesforce export|hubspot export|calendar export|call recording|gong|zoom recording|transcript|personal email|phone number|full name|password|credential|api key|token|secret|private customer data|pii|ssn/i])) {
    addFinding(findings, "private customer data, CRM export, calendar export, call recording, credentials, or PII risk:", "Do not paste exports, recordings, transcripts, credentials, or private buyer data into public tools.");
  }
  return findings;
}

function section(title, items) {
  if (!items.length) return "";
  return `<section class="brief-section"><h4>${title}</h4><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></section>`;
}

function generateBrief() {
  const input = collectInput();
  const hasInput = ["notes", "meeting", "intent", "pain", "timing", "reminder", "stakeholder", "reschedule", "cadence", "draft"].some((key) => input[key]);
  if (!hasInput) {
    workflowError.textContent = "Paste demo no-show notes before generating a recovery brief.";
    track("brief_generation_failed", { reason: "empty_input" });
    return;
  }
  workflowError.textContent = "";
  track("core_action_started", { action: "generate_recovery_brief" });
  const findings = analyze(input);
  const summary = [
    input.meeting ? `<strong>Meeting context:</strong> ${escapeHtml(input.meeting)}` : "",
    input.intent ? `<strong>Buyer intent:</strong> ${escapeHtml(input.intent)}` : "",
    input.pain ? `<strong>Buyer pain/value hook:</strong> ${escapeHtml(input.pain)}` : "",
    input.timing ? `<strong>No-show timing:</strong> ${escapeHtml(input.timing)}` : "",
    input.reminder ? `<strong>Reminder context:</strong> ${escapeHtml(input.reminder)}` : "",
    input.stakeholder ? `<strong>Stakeholder/account:</strong> ${escapeHtml(input.stakeholder)}` : "",
    input.reschedule ? `<strong>Reschedule path:</strong> ${escapeHtml(input.reschedule)}` : "",
    input.cadence ? `<strong>Owner/cadence:</strong> ${escapeHtml(input.cadence)}` : "",
    input.draft ? `<strong>Recovery draft:</strong> ${escapeHtml(input.draft)}` : "",
  ].filter(Boolean);
  const grouped = findings.length
    ? findings.map((finding) => `<strong>${finding.title}</strong> ${finding.message}`)
    : ["No blocking demo no-show recovery gaps detected in the public-safe notes."];
  const outline = [
    "Acknowledge the missed meeting without blame or guilt.",
    "Reconnect the message to the buyer's original reason for booking.",
    "Offer one low-friction reschedule path or a useful async next step.",
    "Set a respectful stop condition if the buyer is no longer interested.",
  ];
  const handoff = [
    "Assign AE, SDR, founder, or RevOps owner.",
    "Confirm whether the next touch is same-day, 24-hour, or final close-loop follow-up.",
    "Keep CRM exports, calendar exports, recordings, and private buyer data out of public tools.",
    "Measure reschedule replies before scaling the recovery copy.",
  ];
  const reminders = [
    "This tool does not connect to CRM, calendar, sales engagement, call recording, email, or customer data stores.",
    "Avoid blame, fake urgency, pressure, unsupported claims, and deceptive reschedule copy.",
  ];
  briefOutput.innerHTML = [
    "<div class=\"brief-summary\"><h3>Demo no-show recovery brief ready</h3><p>Use this before sales or RevOps sends a reschedule follow-up.</p></div>",
    section("Parse summary", summary),
    section("Missing context and risk warnings", grouped),
    section("Buyer-safe recovery outline", outline),
    section("Sales handoff", handoff),
    section("Safety reminders", reminders),
  ].join("");
  latestBriefText = [
    "Demo no-show recovery brief",
    "",
    "Warnings:",
    ...findings.map((finding) => `- ${finding.title} ${finding.message}`),
    "",
    "Buyer-safe recovery outline:",
    ...outline.map((item) => `- ${item}`),
  ].join("\n");
  outputPanel.classList.add("has-brief", findings.length ? "status-warning" : "status-good");
  outputPanel.classList.remove(findings.length ? "status-good" : "status-warning");
  outputStatus.textContent = findings.length ? `${findings.length} warning checks ready` : "Recovery brief ready";
  copyButton.disabled = false;
  track("brief_generated", { warnings: findings.length });
  track("core_action_completed", { warnings: findings.length });
}

function loadSample() {
  fields.notes.value = "Inbound demo request from pricing page. VP Sales missed the call today after accepting the calendar invite.";
  fields.meeting.value = "Inbound pricing-page demo booked through Calendly, qualified as mid-market SaaS.";
  fields.intent.value = "Buyer wanted to reduce SDR follow-up delays and recover missed high-intent demos.";
  fields.pain.value = "Team is losing pipeline when demo requests go cold after one missed meeting.";
  fields.timing.value = "No-show happened 35 minutes ago; same-day follow-up window.";
  fields.reminder.value = "Calendar invite was accepted and reminder email went out 1 hour before the demo.";
  fields.stakeholder.value = "VP Sales at 120-person SaaS account; RevOps manager may also be involved.";
  fields.reschedule.value = "Offer two specific time windows and a calendar link; include async checklist if timing is bad.";
  fields.cadence.value = "AE owns same-day note, SDR sends one 24-hour follow-up, then close loop if no response.";
  fields.draft.value = "Looks like timing slipped today. The pipeline-leak checklist we planned to cover is still useful; want to grab one of these two times or should I send the checklist async?";
  track("sample_loaded");
}

async function copyText(text, statusElement, successText) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  statusElement.textContent = successText;
}

function submitIntent(event) {
  event.preventDefault();
  const email = document.querySelector("#intent-email").value.trim();
  const role = document.querySelector("#intent-role").value.trim();
  const volume = document.querySelector("#demo-volume").value.trim();
  const process = document.querySelector("#current-process").value.trim();
  const plan = document.querySelector("#plan-interest").value;
  const willingness = document.querySelector("#willingness").value.trim();
  const intents = JSON.parse(localStorage.getItem(INTENTS_KEY) || "[]");
  intents.push({ role, volume, process, plan, willingness, selectedPlan, emailProvided: Boolean(email), timestamp: new Date().toISOString() });
  localStorage.setItem(INTENTS_KEY, JSON.stringify(intents.slice(-100)));
  latestRemoteText = [
    "Demo No-Show Recovery Briefs early access request",
    "",
    `Role/team: ${role || "not provided"}`,
    `Demo volume: ${volume || "not provided"}`,
    `Current no-show process: ${process || "not provided"}`,
    `Plan interest: ${plan}`,
    `Willingness to pay: ${willingness || "not provided"}`,
    "",
    "Email intentionally excluded from this public issue body.",
  ].join("\n");
  const params = new URLSearchParams({
    template: "demo_request.md",
    labels: "early-access,purchase-intent,demo-request",
    title: "Early access request: Demo No-Show Recovery Briefs",
    body: latestRemoteText,
  });
  remoteIntentLink.href = `${ISSUE_BASE}?${params.toString()}`;
  remoteIntent.hidden = false;
  intentStatus.textContent = "You are on the early access list. Use the public request if you want a remote handoff.";
  track("purchase_intent_submitted", { plan, selectedPlan, emailProvided: Boolean(email) });
  track("waitlist_submitted", { plan, selectedPlan, emailProvided: Boolean(email) });
  track("signup_completed", { plan, selectedPlan, emailProvided: Boolean(email) });
  track("remote_intent_ready", { hasRole: Boolean(role), hasVolume: Boolean(volume) });
}

document.querySelectorAll("a[href='#workflow']").forEach((link) => link.addEventListener("click", () => track("cta_clicked", { triggerSource: "workflow_link" })));
document.querySelectorAll(".plan-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedPlan = button.dataset.plan || "Starter";
    document.querySelector("#plan-interest").value = selectedPlan;
    document.querySelector("#intent-email").focus();
    track("plan_selected", { plan: selectedPlan });
    track("pricing_viewed", { plan: selectedPlan });
    track("signup_started", { plan: selectedPlan });
  });
});
sampleButton?.addEventListener("click", loadSample);
generateButton?.addEventListener("click", generateBrief);
copyButton?.addEventListener("click", async () => {
  await copyText(latestBriefText, copyStatus, "Copied recovery brief");
  track("copy_brief_clicked");
});
intentForm?.addEventListener("submit", submitIntent);
copyRemoteIntent?.addEventListener("click", async () => {
  await copyText(latestRemoteText, remoteCopyStatus, "Copied request details");
  track("remote_intent_copied");
});
if (window.location.pathname.endsWith("demo-no-show-follow-up-email-template.html")) {
  track("template_opened");
  track("seo_page_viewed", { page: "demo_no_show_template" });
}
if (window.location.pathname === "/" || window.location.pathname.endsWith("/") || window.location.pathname.endsWith("/index.html")) {
  track("landing_viewed");
}
track("page_view");
