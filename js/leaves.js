document.addEventListener("DOMContentLoaded", () => {
  if (!HCM.guard("admin")) return;
  HCM.shell("leaves");
  document
    .querySelector(".content")
    .insertAdjacentHTML(
      "beforeend",
      `<header class="topbar"><div><h2>Leave requests</h2><p>Review requests and leave a decision note.</p></div></header><section class="panel"><div class="filters"><select id="leaveStatus"><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Action</th></tr></thead><tbody id="leaveRows"></tbody></table></div></section>`,
    );
  HCM.endShell();
  function render() {
    let filter = document.querySelector("#leaveStatus").value,
      ls = HCM.list("leaves")
        .filter((x) => !filter || x.status === filter)
        .sort((a, b) => b.id - a.id);
    document.querySelector("#leaveRows").innerHTML = ls.length
      ? ls
          .map((l) => {
            let u = HCM.users().find((x) => x.id === l.userId);
            return `<tr><td><div class="person"><div class="mini-avatar">${HCM.initials(u?.name)}</div><div><b>${HCM.esc(u?.name || "Former employee")}</b><span>${HCM.esc(u?.department || "")}</span></div></div></td><td>${HCM.esc(l.type)}</td><td>${HCM.formatDate(l.from)} - ${HCM.formatDate(l.to)}</td><td>${l.days}</td><td><span class="badge ${l.status}">${l.status}</span></td><td>${l.status === "pending" ? `<button class="icon-btn" onclick="reviewLeave(${l.id},'approved')">Approve</button> <button class="icon-btn delete" onclick="reviewLeave(${l.id},'rejected')">Reject</button>` : HCM.esc(l.comment || "—")}</td></tr>`;
          })
          .join("")
      : '<tr><td colspan="6" class="empty">No leave requests yet.</td></tr>';
  }
  render();
  document.querySelector("#leaveStatus").onchange = render;
  window.reviewLeave = (id, status) => {
    let l = HCM.list("leaves").find((x) => x.id === id);
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="modal-backdrop"><div class="modal"><h3>${status === "approved" ? "Approve" : "Reject"} leave request</h3><p class="muted">${HCM.esc(l.reason)}</p><form id="reviewForm" class="form-grid"><label>Comment <span class="muted">(optional)</span><textarea name="comment" placeholder="Add a note for the employee"></textarea></label><div class="modal-actions"><button type="button" class="btn ghost cancel">Cancel</button><button class="btn ${status === "approved" ? "primary" : "danger"}">Confirm ${status}</button></div></form></div></div>`,
    );
    let b = document.querySelector(".modal-backdrop");
    b.querySelector(".cancel").onclick = () => b.remove();
    b.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      let leaves = HCM.list("leaves"),
        x = leaves.find((x) => x.id === id);
      x.status = status;
      x.comment = new FormData(e.target).get("comment").trim();
      HCM.set("leaves", leaves);
      b.remove();
      render();
      HCM.toast(`Leave ${status}`);
    };
  };
});
