<script setup>
import { ref } from "vue";
const router = useRouter();
const formError = ref("");
const supabase = useSupabaseClient();
const data = ref([]);
const error = ref(null);
const email = ref("");
const password = ref("");
const popupMessage = ref("");
const showPopup = ref(false);

const triggerPopup = (message) => {
  popupMessage.value = message;
  showPopup.value = true;
};
const validateForm = () => {
  if (!email.value || !password.value) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  if (!emailRegex.test(email.value)) {
    return false;
  }

  if (!passwordRegex.test(password.value)) {
    return false;
  }

  formError.value = "";
  return true;
};
const validateData = async () => {
  error.value = null;

  if (!validateForm()) {
    triggerPopup("Corrija los errores en el formulario antes de enviar.");
    return;
  }
  const { data, error: err } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email.value)
    .eq("password", password.value)
    .single();

  if (err || !data) {
    triggerPopup("Email o contraseña incorrectos");
    return;
  }

  localStorage.setItem("session_email", email.value);
  triggerPopup("Sesion iniciada exitosamente.");
  router.push("/home");
};
onMounted(async () => {
  const { data: result, error: err } = await supabase
    .from("usuarios")
    .select("*");

  data.value = result;
  error.value = err;
});
</script>
<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <div
      class="w-full md:w-1/2 h-64 md:h-auto bg-cover bg-center"
      :style="{
        backgroundImage:
          'url(/paisaje-montanas-arboles-contra-cielo-puesta-sol_1048-21262.jpg)',
      }"
    ></div>

    <div
      class="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-[#ecd1b2]"
    >
      <Navbar
        :showLandingLinks="false"
        :showRegisterLinks="true"
        :showSesionLinks="false"
      />

      <Popup
        v-if="showPopup"
        :message="popupMessage"
        :duration="3000"
        @close="showPopup = false"
      />

      <div class="w-full max-w-md text-center mb-6">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800">
          Iniciar Sesión
        </h1>
        <p class="mt-2 text-sm md:text-base text-gray-700/90">
          Tu próximo capítulo te espera
        </p>
      </div>

      <form class="w-full max-w-md flex flex-col gap-4">
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
          type="password"
          iconName="mdi:password-outline"
          :regex="/^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/"
        >
          <template #label>Contraseña</template>
          <template #error
            >La contraseña debe tener una longitud minima de 8 caracteres,
            incluyendo numeros, mayusculas y al menos un caracter
            especial</template
          >
        </DataInput>

        <button
          type="button"
          @click="validateData"
          class="mt-4 bg-[#c9684a] text-white px-4 py-3 rounded-full hover:bg-[#b25738] transition-colors text-lg"
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  </div>
</template>
