function toast(title, message) {
  const toastEl = document.getElementById("gameToast");
  const titleEl = document.getElementById("toast-title");
  const bodyEl  = document.getElementById("toast-body");
  const timeEl  = document.getElementById("toast-time");

  titleEl.textContent = title;
  bodyEl.innerHTML = message.replace(/\n/g, "<br>");
  timeEl.textContent  = new Date().toLocaleTimeString();

  const bsToast = new bootstrap.Toast(toastEl);
  bsToast.show();
}

export { toast };
