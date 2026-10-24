document.addEventListener("DOMContentLoaded", () => {
  const exists = !!HCM.company(),
    setup = document.querySelector("#setupView"),
    login = document.querySelector("#loginView");
  (exists ? login : setup).hidden = false;
  document.querySelectorAll(".password-toggle").forEach((button) =>
    button.addEventListener("click", () => {
      let input = button.parentElement.querySelector("input"),
        show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password",
      );
    }),
  );
  function clear(form) {
    form.querySelectorAll("small").forEach((x) => (x.textContent = ""));
  }
  function error(input, msg) {
    input.closest("label").querySelector("small").textContent = msg;
  }
  setup?.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    let f = e.target,
      v = Object.fromEntries(new FormData(f)),
      ok = true;
    clear(f);
    if (!v.companyName.trim()) {
      error(f.companyName, "Company name is required");
      ok = false;
    }
    if (!v.name.trim()) {
      error(f.name, "Your name is required");
      ok = false;
    }
    if (!/^\S+@\S+\.\S+$/.test(v.email)) {
      error(f.email, "Enter a valid email");
      ok = false;
    }
    if (v.password.length < 4) {
      error(f.password, "Use at least 4 characters");
      ok = false;
    }
    if (!ok) return;
    let button = f.querySelector("button[type=submit]");
    button.classList.add("is-loading");
    button.firstChild.textContent = "Creating workspace ";
    HCM.set("company", {
      name: v.companyName.trim(),
      startTime: "09:00",
      grace: 15,
      leaveQuota: 20,
      workingDays: [1, 2, 3, 4, 5],
    });
    let admin = {
      id: HCM.id(),
      name: v.name.trim(),
      email: v.email.trim().toLowerCase(),
      password: v.password,
      role: "admin",
      department: "Management",
      salary: 0,
    };
    HCM.set("users", [admin]);
    HCM.set("attendance", []);
    HCM.set("leaves", []);
    HCM.set("announcements", []);
    HCM.set("session", { userId: admin.id });
    setTimeout(() => {
      button.classList.remove("is-loading");
      button.textContent = "Workspace created ✓";
      location.href = "admin.html";
    }, 420);
  });
  login?.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    let form = e.target,
      v = Object.fromEntries(new FormData(form)),
      u = HCM.users().find(
        (x) =>
          x.email === v.email.trim().toLowerCase() && x.password === v.password,
      ),
      err = document.querySelector("#loginError");
    err.textContent = u ? "" : "That email or password does not match.";
    if (u) {
      let button = form.querySelector("button[type=submit]");
      button.classList.add("is-loading");
      button.firstChild.textContent = "Signing in ";
      HCM.set("session", { userId: u.id });
      setTimeout(
        () =>
          (location.href = u.role === "admin" ? "admin.html" : "employee.html"),
        300,
      );
    }
  });
});
