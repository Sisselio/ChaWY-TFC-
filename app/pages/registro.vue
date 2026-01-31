<script setup>
import { ref } from "vue";
import Popup from "~/components/popup.vue";
const router = useRouter();
const supabase = useSupabaseClient();
const data = ref([]);
const error = ref(null);
const email = ref("");
const user = ref("");
const password = ref("");
const popupMessage = ref("");
const showPopup = ref(false);

const triggerPopup = (message) => {
  popupMessage.value = message;
  showPopup.value = true;
};

const validateForm = () => {
  if (!user.value || !email.value || !password.value) {
    return false;
  }

  const userRegex = /^[\w]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  if (!userRegex.test(user.value)) {
    return false;
  }

  if (!emailRegex.test(email.value)) {
    return false;
  }

  if (!passwordRegex.test(password.value)) {
    return false;
  }

  return true;
};

onMounted(async () => {
  const { data: result, error: err } = await supabase
    .from("usuarios")
    .select("*");

  data.value = result;
  error.value = err;
});
const insertData = async () => {
  error.value = null;

  if (!validateForm()) {
    triggerPopup("Corrija los errores en el formulario antes de enviar.");
    return;
  }

  const { data: existingEmail } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email.value)
    .single();

  if (existingEmail) {
    triggerPopup("Este email ya está registrado");
    return;
  }
  const { error: err } = await supabase.from("usuarios").insert([
    {
      username: user.value,
      email: email.value,
      password: password.value,
    },
  ]);

  if (err) {
    triggerPopup("Error al registrar el usuario");
    return;
  }
  localStorage.clear();
  localStorage.setItem("created_user", email.value);

  triggerPopup("Registro exitoso");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  router.push("/createUser");
};
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <!-- Imagen izquierda -->
    <div
      class="md:w-1/2 w-full h-64 md:h-auto relative bg-cover bg-center"
      :style="{
        backgroundImage:
          'url(/paisaje-montanas-arboles-contra-cielo-puesta-sol_1048-21262.jpg)',
      }"
    >
      <!-- Texto solo visible en escritorio -->
      <div
        class="hidden md:block absolute bottom-1/3 left-4 md:left-8 text-white max-w-xs"
      >
        <h1 class="text-2xl md:text-3xl font-bold leading-snug">
          Descubre
          <span class="text-[#c9684a] text-4xl">conexiones reales</span> que
          perduran
        </h1>
      </div>
    </div>

    <!-- Formulario derecha -->
    <div
      class="md:w-1/2 w-full flex flex-col justify-center items-center p-8 bg-[#ecd1b2]"
    >
      <Navbar
        :showLandingLinks="false"
        :showRegisterLinks="false"
        :showSesionLinks="true"
      />

      <Popup
        v-if="showPopup"
        :message="popupMessage"
        :duration="3000"
        @close="showPopup = false"
      />

      <!-- Encabezado del formulario -->
      <div class="w-full max-w-md text-center mb-6">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800">
          Crea tu historia
        </h1>
        <p class="mt-2 text-sm md:text-base text-gray-700/90">
          Un nuevo capítulo empieza aquí
        </p>
      </div>

      <!-- Formulario -->
      <form class="w-full max-w-md flex flex-col gap-4">
        <DataInput
          v-model="user"
          type="text"
          iconName="ri:user-line"
          :regex="/^[\w]+$/"
        >
          <template #label>Nombre de usuario</template>
          <template #error>El usuario no tiene un formato válido</template>
        </DataInput>

        <DataInput
          v-model="email"
          type="email"
          iconName="material-symbols:mail-outline"
          :regex="/^[^\s@]+@[^\s@]+\.[^\s@]+$/"
        >
          <template #label>Email</template>
          <template #error>El email no tiene un formato válido</template>
        </DataInput>

        <DataInput
          v-model="password"
          type="text"
          iconName="mdi:password-outline"
          :regex="/^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/"
        >
          <template #label>Contraseña</template>
          <template #error>La contraseña no tiene un formato válido</template>
        </DataInput>

        <button
          type="button"
          @click="insertData"
          class="mt-4 bg-[#c9684a] text-white px-4 py-3 rounded-full hover:bg-[#b25738] transition-colors text-lg"
        >
          Registrar
        </button>
      </form>
    </div>
  </div>
</template>
