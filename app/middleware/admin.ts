export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const role = localStorage.getItem("session_role");

  if (role !== "admin") {
    return navigateTo("/sesion");
  }
});
