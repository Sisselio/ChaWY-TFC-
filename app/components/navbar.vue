<script setup>
import { ref, onMounted } from "vue";
import Button from "./button.vue";

const supabase = useSupabaseClient();
const logout = () => {
  localStorage.removeItem("session_email");
  router.push("/");
};
defineProps({
  showLandingLinks: Boolean,
  showRegisterLinks: Boolean,
  showSesionLinks: Boolean,
  showHomeLinks: Boolean,
});

const sessionMail = ref(null);
const sessionUser = ref(null);
const sessionProfile = ref(null);

onMounted(async () => {
  sessionMail.value = localStorage.getItem("session_email");

  if (!sessionMail.value) return;

  const { data: username, error } = await supabase
    .from("usuarios")
    .select("username")
    .eq("email", sessionMail.value)
    .single();

  if (error) {
    return;
  }
  const { data: profile, error: profileError } = await supabase
    .from("perfiles")
    .select("foto_perfil_url")
    .eq("email_usuario", sessionMail.value)
    .single();

  if (profileError) {
    return;
  }
  sessionUser.value = username.username;
  sessionProfile.value = profile.foto_perfil_url;
});
</script>

<template>
  <nav
    class="fixed top-0 left-0 z-50 w-full flex justify-between bg-[#fcf5e8] text-[#bfa695] h-16 items-center"
  >
    <router-link to="/" v-if="!showHomeLinks"
      ><img
        src="/Chawy.png"
        alt="Chawy"
        class="w-24 h-auto hover:scale-105 transition-transform"
    /></router-link>
    <ul class="flex flex-row gap-4">
      <li v-if="showLandingLinks"><a href="#funcion">Como funciona</a></li>
      <li v-if="showLandingLinks"><a href="#historias">Historias</a></li>
      <li v-if="showRegisterLinks">
        <a href="/registro" class="underline">Registrarse</a>
      </li>
      <li v-if="showHomeLinks">
        <a href="/" class="underline" @click="logout">Cerrar Sesion</a>
      </li>
      <li v-if="showHomeLinks && sessionUser">Hola {{ sessionUser }}</li>
      <li v-if="showHomeLinks && sessionProfile">
        <img
          :src="sessionProfile"
          alt="Foto de perfil"
          class="w-10 h-10 rounded-full object-cover"
        />
      </li>
      <div v-if="showSesionLinks">
        <Button
          href="/sesion"
          bgColor="bg-[#c9684a]"
          textColor="text-white"
          class="p-3 rounded-full mr-4"
        >
          Iniciar sesion
        </Button>
      </div>
    </ul>
  </nav>
</template>
