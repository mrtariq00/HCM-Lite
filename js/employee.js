document.addEventListener("DOMContentLoaded", () => {
  if (!HCM.guard("employee")) return;
  HCM.shell("employee");
  const u = HCM.user(),
    today = HCM.today(),
    record = HCM.recordsFor(u.id).find((x) => x.date === today),
    quota = HCM.company().leaveQuota,
    used = HCM.approvedLeaveDays(u.id),
    left = Math.max(0, quota - used),
    pending = HCM.list("leaves")
      .filter((x) => x.userId === u.id && x.status === "pending")
      .reduce((n, x) => n + x.days, 0);
  document.querySelector(".content").insertAdjacentHTML(
    "beforeend",
    `<header class="topbar"><div><h2>Hello, ${HCM.esc(u.name.split(" ")[0])}</h2><p>Keep track of your day and your time away.</p></div><div class="avatar">${HCM.initials(u.name)}</div></header>${HCM.announcement() ? `<p class="notice"><b>Team update:</b> ${HCM.esc(HCM.announcement().text)}</p>` : ""}<section class="grid-2"><div class="attendance-card"><div class="eyebrow" style="color:#c8c5ff">TODAY · ${new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div><div class="clock" id="clock"></div><p>${record ? (record.checkOut ? "Your day is complete. Great work!" : "You are checked in. Remember to check out.") : "Ready when you are."}</p><div class="check-state"><i class="status-dot"></i>${record ? `Check-in: ${HCM.time(record.checkIn)}${record.checkOut ? " · Check-out: " + HCM.time(record.checkOut) : ""}` : "Not checked in"}</div><button id="attendanceButton" class="btn" ${record?.checkOut ? "disabled" : ""}>${record ? (record.checkOut ? "Checked out" : "Check out") : "Check in"}</button></div><div class="panel"><div class="panel-head"><h3>Leave balance</h3></div><div class="leave-balance"><div class="balance"><b>${left}</b><span>Days available</span></div><div class="balance"><b>${used}</b><span>Days used</span></div><div class="balance"><b>${pending}</b><span>Pending days</span></div></div><button class="btn secondary" style="margin-top:18px" id="applyLeave">Apply for leave</button></div></section><section class="grid-2 hide" style="margin-top:20px"><div class="panel"><div class="panel-head"><h3>My recent attendance</h3></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Status</th></tr></thead><tbody>${
      HCM.recordsFor(u.id)
        .slice(-6)
        .reverse()
        .map(
          (r) =>
            `<tr><td>${HCM.formatDate(r.date)}</td><td>${HCM.time(r.checkIn)}</td><td>${HCM.time(r.checkOut)}</td><td><span class="badge ${r.status}">${r.status}</span></td></tr>`,
        )
        .join("") ||
      '<tr><td colspan="4" class="empty">Your attendance will appear here.</td></tr>'
    }</tbody></table></div></div><div class="panel helper"><div class="panel-head"><h3>Smart helper</h3><span class="badge approved">Private</span></div><div class="helper-messages"><div class="message">Ask about your leave balance, whether you were late, or hours worked this week.</div></div><form class="helper-form"><input required placeholder="Ask a question..."><button class="btn primary">Send</button></form></div></section><section class="panel" style="margin-top:20px"><div class="panel-head"><h3>My leave requests</h3></div><div class="table-wrap"><table><thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Comment</th></tr></thead><tbody>${
      HCM.list("leaves")
        .filter((l) => l.userId === u.id)
        .sort((a, b) => b.id - a.id)
        .map(
          (l) =>
            `<tr><td>${HCM.esc(l.type)}</td><td>${HCM.formatDate(l.from)} - ${HCM.formatDate(l.to)}</td><td>${l.days}</td><td><span class="badge ${l.status}">${l.status}</span></td><td>${HCM.esc(l.comment || "—")}</td></tr>`,
        )
        .join("") ||
      '<tr><td colspan="5" class="empty">No leave requests yet.</td></tr>'
    }</tbody></table></div></section>`,
  );
  HCM.endShell();
  function clock() {
    document.querySelector("#clock").textContent =
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
  }
  clock();
  setInterval(clock, 1000);
  document.querySelector("#attendanceButton").onclick = () => {
    let all = HCM.list("attendance"),
      r = all.find((x) => x.userId === u.id && x.date === today),
      now = new Date().toISOString();
    if (!r) {
      all.push({
        id: HCM.id(),
        userId: u.id,
        date: today,
        checkIn: now,
        checkOut: null,
        status: HCM.statusFor(now),
      });
      HCM.set("attendance", all);
      HCM.toast("Checked in successfully");
    } else {
      r.checkOut = now;
      let h = (new Date(r.checkOut) - new Date(r.checkIn)) / 36e5;
      if (h < 5) r.status = "half-day";
      HCM.set("attendance", all);
      HCM.toast("Checked out successfully");
    }
    location.reload();
  };
  document.querySelector("#applyLeave").onclick = openLeave;
  document.querySelector(".helper-form").onsubmit = (e) => {
    e.preventDefault();
    let input = e.target.querySelector("input"),
      q = input.value.trim(),
      a = q.toLowerCase(),
      answer;
    if (
      a.includes("leave") &&
      (a.includes("left") || a.includes("balance") || a.includes("have"))
    )
      answer = `You have ${left} leave day(s) available. ${pending ? pending + " day(s) are pending approval." : ""}`;
    else if (a.includes("late") && a.includes("today"))
      answer = record
        ? `You were ${record.status === "late" ? "late" : "not late"} today.`
        : "You have not checked in today.";
    else if (a.includes("hour") && a.includes("week")) {
      let start = new Date();
      start.setDate(start.getDate() - start.getDay() + 1);
      let total = HCM.recordsFor(u.id)
        .filter((r) => new Date(r.date + "T00:00:00") >= start && r.checkOut)
        .reduce(
          (n, r) => n + (new Date(r.checkOut) - new Date(r.checkIn)) / 36e5,
          0,
        );
      answer = `You have worked ${total.toFixed(1)} hours this week.`;
    } else
      answer =
        "I can answer about your leave balance, today’s lateness, and this week’s working hours.";
    document
      .querySelector(".helper-messages")
      .insertAdjacentHTML(
        "beforeend",
        `<div class="message user">${HCM.esc(q)}</div><div class="message">${HCM.esc(answer)}</div>`,
      );
    input.value = "";
  };
  function openLeave() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="modal-backdrop"><div class="modal"><h3>Apply for leave</h3><p class="muted">Only working days count toward your leave balance.</p><form id="leaveForm" class="form-grid"><div class="two"><label>Leave type<select name="type"><option>Casual leave</option><option>Sick leave</option><option>Annual leave</option></select><small></small></label><label>From<input name="from" type="date" required min="${today}"><small></small></label></div><label>To<input name="to" type="date" required min="${today}"><small></small></label><label>Reason<textarea name="reason" required placeholder="Briefly tell your manager why you need time away."></textarea><small></small></label><div class="modal-actions"><button type="button" class="btn ghost cancel">Cancel</button><button class="btn primary">Submit request</button></div></form></div></div>`,
    );
    let b = document.querySelector(".modal-backdrop");
    b.querySelector(".cancel").onclick = () => b.remove();
    b.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      let f = e.target,
        v = Object.fromEntries(new FormData(f));
      f.querySelectorAll("small").forEach((x) => (x.textContent = ""));
      function bad(n, m) {
        f[n].closest("label").querySelector("small").textContent = m;
      }
      if (!v.from || !v.to) {
        bad(!v.from ? "from" : "to", "Choose both dates");
        return;
      }
      if (v.from > v.to) {
        bad("to", "End date must be on or after the start date");
        return;
      }
      let n = HCM.workdays(v.from, v.to);
      if (!n) {
        bad("to", "This range has no working days");
        return;
      }
      let ls = HCM.list("leaves").filter(
          (x) => x.userId === u.id && x.status !== "rejected",
        ),
        overlap = ls.some((x) => v.from <= x.to && v.to >= x.from);
      if (overlap) {
        bad("to", "This overlaps another leave request");
        return;
      }
      let committed = ls.reduce((sum, x) => sum + x.days, 0);
      if (committed + n > quota) {
        bad("to", `This would exceed your ${quota}-day annual quota`);
        return;
      }
      if (!v.reason.trim()) {
        bad("reason", "Reason is required");
        return;
      }
      HCM.set("leaves", [
        ...HCM.list("leaves"),
        {
          id: HCM.id(),
          userId: u.id,
          type: v.type,
          from: v.from,
          to: v.to,
          days: n,
          reason: v.reason.trim(),
          status: "pending",
          comment: "",
        },
      ]);
      b.remove();
      HCM.toast("Leave request submitted");
      location.reload();
    };
  }
});
