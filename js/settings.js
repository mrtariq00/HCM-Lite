document.addEventListener("DOMContentLoaded", () => {
  if (!HCM.guard("admin")) return;
  HCM.shell("settings");
  let c = HCM.company(),
    dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  document
    .querySelector(".content")
    .insertAdjacentHTML(
      "beforeend",
      `<header class="topbar"><div><h2>Company settings</h2><p>These rules power attendance and leave calculations.</p></div></header><div class="settings-section"><form id="settingsForm"><section class="panel"><h3>Company details</h3><div class="form-grid"><label>Company name<input name="name" required value="${HCM.esc(c.name)}"><small></small></label></div></section><section class="panel"><h3>Attendance rules</h3><div class="two-col-form"><label>Office start time<input name="startTime" type="time" required value="${c.startTime}"><small></small></label><label>Grace period (minutes)<input name="grace" type="number" min="0" required value="${c.grace}"><small></small></label></div></section><section class="panel"><h3>Leave rules</h3><div class="form-grid"><label>Yearly leave quota (working days)<input name="leaveQuota" type="number" min="0" required value="${c.leaveQuota}"><small></small></label><label>Working days<div class="toggle-days">${dayNames.map((d, i) => `<label><input type="checkbox" name="workingDays" value="${i}" ${c.workingDays.includes(i) ? "checked" : ""}><span>${d}</span></label>`).join("")}</div><small></small></label></div></section><button class="btn primary">Save settings</button></form><section class="panel"><h3>Post an announcement</h3><form id="announcementForm" class="form-grid"><label>Message<textarea name="text" required placeholder="e.g. The office will be closed on Friday."></textarea><small></small></label><button class="btn secondary">Publish to employees</button></form></section></div>`,
    );
  HCM.endShell();
  document.querySelector("#settingsForm").onsubmit = (e) => {
    e.preventDefault();
    let f = e.target,
      v = Object.fromEntries(new FormData(f)),
      wd = [...f.querySelectorAll("[name=workingDays]:checked")].map(
        (x) => +x.value,
      );
    f.querySelectorAll("small").forEach((x) => (x.textContent = ""));
    if (!v.name.trim()) {
      f.name.closest("label").querySelector("small").textContent =
        "Company name is required";
      return;
    }
    if (wd.length === 0) {
      f
        .querySelector("[name=workingDays]")
        .closest(".toggle-days").nextElementSibling.textContent =
        "Choose at least one working day";
      return;
    }
    HCM.set("company", {
      ...c,
      name: v.name.trim(),
      startTime: v.startTime,
      grace: +v.grace,
      leaveQuota: +v.leaveQuota,
      workingDays: wd,
    });
    HCM.toast("Settings saved");
  };
  document.querySelector("#announcementForm").onsubmit = (e) => {
    e.preventDefault();
    let text = new FormData(e.target).get("text").trim();
    if (text) {
      let a = HCM.list("announcements");
      a.push({ id: HCM.id(), text, date: Date.now() });
      HCM.set("announcements", a);
      e.target.reset();
      HCM.toast("Announcement published");
    }
  };
});
