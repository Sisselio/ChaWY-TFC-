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
    class="fixed top-0 left-0 z-50 w-full flex justify-between items-center bg-[#fcf5e8] text-[#bfa695] h-16 px-4 sm:px-6 md:px-10 lg:px-16 shadow-sm"
  >
    <router-link to="/" v-if="!showHomeLinks">
      <img
        src="/Chawy.png"
        alt="Chawy"
        class="w-20 sm:w-24 h-auto hover:scale-105 transition-transform"
      />
    </router-link>

    <ul
      class="flex flex-wrap items-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm md:text-base"
    >
      <li v-if="showLandingLinks">
        <a href="#funcion" class="hover:text-[#c9684a] whitespace-nowrap">
          Como funciona
        </a>
      </li>
      <li v-if="showLandingLinks">
        <a href="#historias" class="hover:text-[#c9684a] whitespace-nowrap">
          Historias
        </a>
      </li>

      <li v-if="showRegisterLinks">
        <a href="/registro" class="underline whitespace-nowrap">
          Registrarse
        </a>
      </li>

      <li
        v-if="showHomeLinks"
        class="flex items-center gap-2 whitespace-nowrap"
      >
        <span v-if="sessionUser">Hola {{ sessionUser }}</span>
        <img
          v-if="sessionProfile"
          :src="sessionProfile"
          alt="Foto de perfil"
          class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full object-cover"
        />
      </li>

      <li v-if="showHomeLinks">
        <a href="/" class="underline whitespace-nowrap" @click="logout">
          Cerrar Sesión
        </a>
      </li>

      <li v-if="showSesionLinks">
        <Button
          href="/sesion"
          bgColor="bg-[#c9684a]"
          textColor="text-white"
          class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap"
        >
          Iniciar sesión
        </Button>
      </li>
    </ul>
  </nav>
</template>
