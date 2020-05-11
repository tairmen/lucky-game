function cancel() {
  window.history.replaceState(null, null, window.location.pathname);
  setTimeout(() => {
    location.href = "/admin";
  }, 10);
}