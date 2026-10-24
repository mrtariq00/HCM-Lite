document.addEventListener("DOMContentLoaded", () => {
  if (!HCM.guard("admin")) return;
  HCM.shell("departments");
  const staff = HCM.users().filter((u) => u.role === "employee");
  const groups = staff.reduce((all, u) => {
    let name = u.department || "Unassigned";
    (all[name] ??= []).push(u);
    return all;
  }, {});
  document.querySelector(".content").insertAdjacentHTML(
    "beforeend",
    `<header class="topbar"><div><h2>Departments</h2><p>See how your people are organised across the company.</p></div><a class="btn primary" href="employees.html">Manage employees</a></header><section class="stats"><div class="stat"><span class="stat-label">DEPARTMENTS</span><div class="stat-number">${Object.keys(groups).length}</div></div><div class="stat"><span class="stat-label">TEAM MEMBERS</span><div class="stat-number">${staff.length}</div></div><div class="stat"><span class="stat-label">UNASSIGNED</span><div class="stat-number">${(groups.Unassigned || []).length}</div></div><div class="stat"><span class="stat-label">LARGEST TEAM</span><div class="stat-number">${Object.values(groups).reduce((n, a) => Math.max(n, a.length), 0)}</div></div></section><section class="panel"><div class="panel-head"><h3>Department directory</h3><span class="muted">Live from employee records</span></div>${
      Object.keys(groups).length
        ? Object.entries(groups)
            .sort()
            .map(
              ([name, team]) =>
                `<div class="department-card"><div><b>${HCM.esc(name)}</b><p>${team.map((x) => HCM.esc(x.name)).join(" · ")}</p></div><span class="badge approved">${team.length} member${team.length === 1 ? "" : "s"}</span></div>`,
            )
            .join("")
        : `<div class="empty"><div class="empty-illustration" aria-hidden="true"></div>No departments yet. Add employees and assign their department.</div>`
    }</section>`,
  );
  HCM.endShell();
});
