<script setup>
import { ref } from "vue";
const router = useRouter();
const formError = ref("");
const supabase = useSupabaseClient();
const data = ref([]);
const error = ref(null);
const email = ref("Test@gmail.com");
const password = ref("Test@pwd1");
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
  <form class="mt-16">
    <DataInput
      v-model="email"
      type="email"
      iconName="material-symbols:mail-outline"
      :regex="/^[^\s@]+@[^\s@]+\.[^\s@]+$/"
    >
      <template #label>Email</template>

      <template #error> El email no tiene un formato válido </template>
    </DataInput>
    <DataInput
      v-model="password"
      type="text"
      iconName="mdi:password-outline"
      :regex="/^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/"
    >
      <template #label>Contraseña</template>

      <template #error> La contraseña no tiene un formato válido </template>
    </DataInput>
    <br />
    <br />
    <button type="button" @click="validateData">Iniciar Sesión</button>
  </form>
</template>
