document.addEventListener("DOMContentLoaded", () => {
  if (!HCM.guard("admin")) return;
  HCM.shell("employees");
  document
    .querySelector(".content")
    .insertAdjacentHTML(
      "beforeend",
      `<header class="topbar"><div><h2>Employees</h2><p>Add and manage team member accounts.</p></div><button class="btn primary" id="addEmployee">+ Add employee</button></header><section class="panel"><div class="filters"><input id="search" placeholder="Search name or email"><select id="department"><option value="">All departments</option></select></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Monthly salary</th><th>Actions</th></tr></thead><tbody id="employeeRows"></tbody></table></div></section>`,
    );
  HCM.endShell();
  let editing = null;
  function render() {
    let all = HCM.users().filter((x) => x.role === "employee"),
      depts = [...new Set(all.map((x) => x.department).filter(Boolean))],
      select = document.querySelector("#department"),
      old = select.value;
    select.innerHTML =
      '<option value="">All departments</option>' +
      depts
        .map(
          (d) =>
            `<option ${d === old ? "selected" : ""}>${HCM.esc(d)}</option>`,
        )
        .join("");
    let q = document.querySelector("#search").value.toLowerCase(),
      dep = select.value,
      rows = all.filter(
        (x) =>
          (x.name + x.email).toLowerCase().includes(q) &&
          (!dep || x.department === dep),
      );
    document.querySelector("#employeeRows").innerHTML = rows.length
      ? rows
          .map(
            (u) =>
              `<tr><td><div class="person"><div class="mini-avatar">${HCM.initials(u.name)}</div><div><b>${HCM.esc(u.name)}</b><span>${HCM.esc(u.email)}</span></div></div></td><td>${HCM.esc(u.department)}</td><td>Rs. ${Number(u.salary).toLocaleString()}</td><td><div class="row-actions"><button class="icon-btn" onclick="editEmployee(${u.id})">Edit</button><button class="icon-btn delete" onclick="deleteEmployee(${u.id})">Delete</button></div></td></tr>`,
          )
          .join("")
      : '<tr><td colspan="4" class="empty">No employees match your search.</td></tr>';
  }
  render();
  document.querySelector("#search").oninput = render;
  document.querySelector("#department").onchange = render;
  document.querySelector("#addEmployee").onclick = () => open();
  window.editEmployee = (id) => {
    editing = HCM.users().find((x) => x.id === id);
    open(editing);
  };
  window.deleteEmployee = (id) => {
    let u = HCM.users().find((x) => x.id === id);
    if (
      confirm(
        `Delete ${u.name}? Their attendance and leave records remain for reporting.`,
      )
    ) {
      HCM.set(
        "users",
        HCM.users().filter((x) => x.id !== id),
      );
      render();
      HCM.toast("Employee deleted");
    }
  };
  function open(u = {}) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="modal-backdrop"><div class="modal"><h3>${u.id ? "Edit employee" : "Add employee"}</h3><p class="muted">${u.id ? "Update this account." : "This creates an employee login."}</p><form id="employeeForm" class="form-grid" novalidate><div class="two"><label>Full name<input name="name" value="${HCM.esc(u.name || "")}" required><small></small></label><label>Department<input name="department" value="${HCM.esc(u.department || "")}" required placeholder="e.g. Design"><small></small></label></div><label>Email address<input name="email" type="email" value="${HCM.esc(u.email || "")}" required><small></small></label><div class="two"><label>Monthly salary (Rs.)<input name="salary" type="number" min="1" value="${u.salary || ""}" required><small></small></label><label>Password ${u.id ? "(leave blank to keep)" : ""}<input name="password" type="password" ${u.id ? "" : "required"} placeholder="${u.id ? "Unchanged" : "Create a password"}"><small></small></label></div><div class="modal-actions"><button type="button" class="btn ghost cancel">Cancel</button><button class="btn primary">${u.id ? "Save changes" : "Create employee"}</button></div></form></div></div>`,
    );
    let back = document.querySelector(".modal-backdrop");
    back.querySelector(".cancel").onclick = () => back.remove();
    back.addEventListener("click", (e) => {
      if (e.target === back) back.remove();
    });
    back.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      let f = e.target,
        v = Object.fromEntries(new FormData(f)),
        ok = true;
      f.querySelectorAll("small").forEach((x) => (x.textContent = ""));
      function bad(n, m) {
        f[n].closest("label").querySelector("small").textContent = m;
        ok = false;
      }
      if (!v.name.trim()) bad("name", "Name is required");
      if (!v.department.trim()) bad("department", "Department is required");
      if (!/^\S+@\S+\.\S+$/.test(v.email)) bad("email", "Enter a valid email");
      if (
        HCM.users().some(
          (x) => x.email === v.email.trim().toLowerCase() && x.id !== u.id,
        )
      )
        bad("email", "That email is already used");
      if (+v.salary <= 0) bad("salary", "Salary must be greater than 0");
      if (!u.id && v.password.length < 4)
        bad("password", "Use at least 4 characters");
      if (!ok) return;
      let data = {
        ...u,
        id: u.id || HCM.id(),
        name: v.name.trim(),
        department: v.department.trim(),
        email: v.email.trim().toLowerCase(),
        salary: +v.salary,
        role: "employee",
        password: v.password || u.password,
      };
      HCM.set(
        "users",
        u.id
          ? HCM.users().map((x) => (x.id === u.id ? data : x))
          : [...HCM.users(), data],
      );
      back.remove();
      render();
      HCM.toast(u.id ? "Employee updated" : "Employee account created");
    };
  }
});
