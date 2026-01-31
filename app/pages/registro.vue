<script setup>
import { ref } from "vue";
import Popup from "~/components/popup.vue";
const router = useRouter();
const supabase = useSupabaseClient();
const data = ref([]);
const error = ref(null);
const email = ref("Test@gmail.com");
const user = ref("TestUser");
const password = ref("Test@pwd1");
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

  <form class="mt-16">
    <DataInput
      v-model="user"
      type="text"
      iconName="ri:user-line"
      :regex="/^[\w]+$/"
    >
      <template #label>Nombre de usuario</template>

      <template #error> El usuario no tiene un formato válido </template>
    </DataInput>
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
    <button type="button" @click="insertData">Registrar</button>
  </form>
</template>
