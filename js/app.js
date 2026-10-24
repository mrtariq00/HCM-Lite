/* Shared application state and business rules. */
(() => {
  const visuals = document.createElement("script");
  visuals.src = "js/visuals.js";
  document.head.append(visuals);
})();
const HCM = (() => {
  const KEYS = {
    company: "hcm_company",
    users: "hcm_users",
    attendance: "hcm_attendance",
    leaves: "hcm_leaves",
    session: "hcm_session",
    announcements: "hcm_announcements",
  };
  const get = (k) => JSON.parse(localStorage.getItem(KEYS[k]) || "null");
  const set = (k, v) => localStorage.setItem(KEYS[k], JSON.stringify(v));
  const list = (k) => get(k) || [];
  const today = () => new Date().toISOString().slice(0, 10);
  const id = () => Date.now() + Math.floor(Math.random() * 999);
  const company = () => get("company");
  const users = () => list("users");
  const session = () => get("session");
  const user = () => users().find((x) => x.id === session()?.userId);
  const initials = (n) =>
    (n || "?")
      .split(" ")
      .map((x) => x[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  const formatDate = (s) =>
    s
      ? new Date(s + "T00:00:00").toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";
  const time = (t) =>
    t
      ? new Date(t).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const days = () => company()?.workingDays || [1, 2, 3, 4, 5];
  const isWorkday = (s) => days().includes(new Date(s + "T00:00:00").getDay());
  function workdays(from, to) {
    let n = 0,
      d = new Date(from + "T00:00:00"),
      e = new Date(to + "T00:00:00");
    for (; d <= e; d.setDate(d.getDate() + 1))
      if (days().includes(d.getDay())) n++;
    return n;
  }
  function inRange(s, a, b) {
    return s >= a && s <= b;
  }
  function statusFor(checkIn) {
    let c = company(),
      d = new Date(checkIn),
      [h, m] = (c.startTime || "09:00").split(":").map(Number),
      limit = new Date(d);
    limit.setHours(h, m + (+c.grace || 0), 0, 0);
    return d > limit ? "late" : "present";
  }
  function saveUser(updated) {
    set(
      "users",
      users().map((x) => (x.id === updated.id ? updated : x)),
    );
  }
  function guard(role) {
    const u = user();
    if (!u) {
      location.href = "index.html";
      return false;
    }
    if (role && u.role !== role) {
      location.href = u.role === "admin" ? "admin.html" : "employee.html";
      return false;
    }
    return true;
  }
  function icon(name) {
    const paths = {
      dashboard:
        '<path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z"/>',
      users:
        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      building:
        '<path d="M3 21h18M6 21V4h12v17M9 8h.01M9 12h.01M9 16h.01M15 8h.01M15 12h.01M15 16h.01"/>',
      calendar:
        '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/>',
      chart: '<path d="M3 3v18h18M7 16v-5M12 16V7M17 16v-9"/>',
      settings:
        '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56v.1h-3v-.1A1.7 1.7 0 0 0 10.68 18.64a1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.04 15 1.7 1.7 0 0 0 5.5 13.96h-.1v-3h.1A1.7 1.7 0 0 0 7.04 9.92a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.72 4.7v-.1h3v.1a1.7 1.7 0 0 0 1.04 1.58 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z"/>',
      receipt: '<path d="M5 3v18l3-2 4 2 4-2 3 2V3H5Zm4 5h6M9 12h6"/>',
    };
    return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.dashboard}</svg>`;
  }
  function shell(active) {
    const u = user(),
      c = company();
    const admin = u.role === "admin";
    const items = admin
      ? [
          ["admin.html", "dashboard", "Overview", "admin"],
          ["employees.html", "users", "Employees", "employees"],
          ["departments.html", "building", "Departments", "departments"],
          ["leaves.html", "calendar", "Leave management", "leaves"],
          // ["reports.html", "chart", "Reports", "reports"],
          ["payslip.html", "receipt", "Payslips", "payslip"],
          ["settings.html", "settings", "Settings", "settings"],
        ]
      : [
          ["employee.html", "dashboard", "My overview", "employee"],
          ["payslip.html", "receipt", "My payslip", "payslip"],
        ];
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div class="shell"><aside class="sidebar"><div class="logo"><b>H</b>HCM Lite</div><div class="company-name">${esc(c?.name || "")}</div><nav class="nav">${items.map((x) => `<a class="${active === x[3] ? "active" : ""}" href="${x[0]}"><span>${icon(x[1])}</span> ${x[2]}</a>`).join("")}</nav><div class="sidebar-bottom"><b>${esc(u.name)}</b><span>${admin ? "Administrator" : esc(u.department || "Employee")}</span><button class="logout" onclick="HCM.logout()">Sign out →</button></div></aside><main class="content">`,
    );
  }
  function endShell() {
    document.body.insertAdjacentHTML("beforeend", "</main></div>");
  }
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>'"]/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[c],
    );
  function toast(msg) {
    let e = document.createElement("div");
    e.className = "toast";
    e.textContent = msg;
    document.body.append(e);
    setTimeout(() => e.remove(), 3000);
  }
  function logout() {
    localStorage.removeItem(KEYS.session);
    location.href = "index.html";
  }
  function recordsFor(uid) {
    return list("attendance").filter((x) => x.userId === uid);
  }
  function approvedLeaveDays(uid, year = new Date().getFullYear()) {
    return list("leaves")
      .filter(
        (l) =>
          l.userId === uid &&
          l.status === "approved" &&
          l.from.startsWith(year),
      )
      .reduce((n, l) => n + l.days, 0);
  }
  function leavesToday(uid) {
    let t = today();
    return list("leaves").filter(
      (l) =>
        l.userId === uid && l.status === "approved" && inRange(t, l.from, l.to),
    );
  }
  function announcement() {
    return list("announcements").slice(-1)[0];
  }
  function accountForm() {
    return `<section class="panel" style="margin-top:20px"><div class="panel-head"><h3>Change password</h3></div><form class="account-form form-grid"><div class="two-col-form"><label>Current password<input name="currentPassword" type="password" required><small></small></label><label>New password<input name="newPassword" type="password" minlength="4" required><small></small></label></div><p class="form-error"></p><div><button class="btn ghost">Update password</button></div></form></section>`;
  }
  document.addEventListener("submit", (e) => {
    if (!e.target.matches(".account-form")) return;
    e.preventDefault();
    let f = e.target,
      u = user(),
      v = Object.fromEntries(new FormData(f)),
      msg = f.querySelector(".form-error");
    msg.textContent = "";
    if (v.currentPassword !== u.password) {
      msg.textContent = "Your current password is incorrect.";
      return;
    }
    if (v.newPassword.length < 4) {
      msg.textContent = "Use at least 4 characters for the new password.";
      return;
    }
    saveUser({ ...u, password: v.newPassword });
    f.reset();
    toast("Password updated");
  });
  return {
    KEYS,
    get,
    set,
    list,
    today,
    id,
    company,
    users,
    session,
    user,
    initials,
    formatDate,
    time,
    days,
    isWorkday,
    workdays,
    inRange,
    statusFor,
    saveUser,
    guard,
    shell,
    endShell,
    esc,
    toast,
    logout,
    recordsFor,
    approvedLeaveDays,
    leavesToday,
    announcement,
    accountForm,
  };
})();
