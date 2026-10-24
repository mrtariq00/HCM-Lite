document.addEventListener("DOMContentLoaded", () => {
  if (!HCM.guard()) return;
  let me = HCM.user(),
    admin = me.role === "admin";
  HCM.shell("payslip");
  let employees = HCM.users().filter((x) => x.role === "employee");
  document
    .querySelector(".content")
    .insertAdjacentHTML(
      "beforeend",
      `<header class="topbar"><div><h2>${admin ? "Payslips" : "My payslip"}</h2><p>Monthly salary summary based on recorded attendance.</p></div><div class="page-actions"><button class="btn secondary" onclick="window.print()">Print / Save PDF</button></div></header>${admin ? `<section class="panel" style="max-width:780px;margin:0 auto 18px"><div class="two-col-form"><label>Employee<select id="payEmployee">${employees.map((x) => `<option value="${x.id}">${HCM.esc(x.name)} - ${HCM.esc(x.department)}</option>`).join("")}</select></label><label>Month<input type="month" id="payMonth" value="${HCM.today().slice(0, 7)}"></label></div></section>` : ""}<div id="payslipHolder"></div>`,
    );
  HCM.endShell();
  let selected = admin ? employees[0]?.id : me.id;
  function render() {
    let uid = admin ? +document.querySelector("#payEmployee").value : selected,
      month = admin
        ? document.querySelector("#payMonth").value
        : HCM.today().slice(0, 7),
      u = HCM.users().find((x) => x.id === uid);
    if (!u) {
      document.querySelector("#payslipHolder").innerHTML =
        '<section class="panel empty">Add an employee before generating a payslip.</section>';
      return;
    }
    let [yr, mo] = month.split("-").map(Number),
      count = 0,
      daysIn = new Date(yr, mo, 0).getDate();
    for (let d = 1; d <= daysIn; d++)
      if (HCM.isWorkday(`${month}-${String(d).padStart(2, "0")}`)) count++;
    let pastEnd =
        month === HCM.today().slice(0, 7) ? +HCM.today().slice(-2) : daysIn,
      records = HCM.recordsFor(uid).filter((r) => r.date.startsWith(month)),
      approved = HCM.list("leaves").filter(
        (l) => l.userId === uid && l.status === "approved",
      ),
      absent = Array.from(
        { length: pastEnd },
        (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
      ).filter(
        (d) =>
          HCM.isWorkday(d) &&
          !records.some((r) => r.date === d) &&
          !approved.some((l) => HCM.inRange(d, l.from, l.to)),
      ).length,
      half = records.filter((r) => r.status === "half-day").length,
      perDay = (+u.salary || 0) / count,
      deduction = perDay * (absent + 0.5 * half),
      net = Math.max(0, (+u.salary || 0) - deduction),
      label = new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    document.querySelector("#payslipHolder").innerHTML =
      `<section class="payslip"><div class="payslip-top"><div><p class="eyebrow">${HCM.esc(HCM.company().name)}</p><h1 class="payslip-title">Salary slip</h1><p class="muted">For ${label}</p></div><div class="muted" style="font-size:12px;text-align:right"><b style="color:#172336">${HCM.esc(u.name)}</b><br>${HCM.esc(u.department || "Employee")}<br>${HCM.esc(u.email)}</div></div><div class="payslip-grid"><div><h3>Earnings</h3><div class="pay-row"><span>Monthly salary</span><b>Rs. ${(+u.salary || 0).toLocaleString()}</b></div><div class="pay-row"><span>Working days in month</span><b>${count}</b></div><div class="pay-row"><span>Per-day rate</span><b>Rs. ${perDay.toFixed(0)}</b></div></div><div><h3>Deductions</h3><div class="pay-row"><span>Absent working days</span><b>${absent}</b></div><div class="pay-row"><span>Half days</span><b>${half}</b></div><div class="pay-row"><span>Attendance deduction</span><b>Rs. ${deduction.toFixed(0)}</b></div></div></div><div class="pay-row total"><span>Net pay</span><span class="net">Rs. ${net.toFixed(0)}</span></div><p class="muted" style="font-size:11px">Attendance is calculated through ${month === HCM.today().slice(0, 7) ? HCM.formatDate(HCM.today()) : label}. Approved leave is excluded from absent-day deductions.</p></section>`;
  }
  if (admin) {
    document.querySelector("#payEmployee").onchange = render;
    document.querySelector("#payMonth").onchange = render;
  }
  render();
});
