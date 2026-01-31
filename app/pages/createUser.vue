<script setup>
import { ref, onMounted, watch } from "vue";
const router = useRouter();

const supabase = useSupabaseClient();
const sessionMail = ref(null);
const sessionUser = ref(null);
const fechaNacimiento = ref("");
const genero = ref("");
const generoPreferido = ref("");
const biografia = ref("");
const fechaError = ref("");
const localizacion = ref("");
const localizacionesProvinciaMadrid = [
  "Madrid",
  "Alcalá de Henares",
  "Getafe",
  "Leganés",
  "Móstoles",
  "Alcorcón",
  "Fuenlabrada",
  "Parla",
  "Coslada",
  "San Fernando de Henares",
  "Torrejón de Ardoz",
  "Alcobendas",
  "San Sebastián de los Reyes",
  "Pozuelo de Alarcón",
  "Majadahonda",
  "Las Rozas de Madrid",
  "Boadilla del Monte",
  "Villaviciosa de Odón",
  "Rivas-Vaciamadrid",
  "Arganda del Rey",
  "Valdemoro",
  "Aranjuez",
  "Collado Villalba",
  "Tres Cantos",
  "Colmenar Viejo",
  "El Escorial",
  "San Lorenzo de El Escorial",
  "Navalcarnero",
  "Pinto",
  "Ciempozuelos",
  "Humanes de Madrid",
  "Moraleja de Enmedio",
  "Mejorada del Campo",
  "Velilla de San Antonio",
];
const fotoPerfil = ref(null);
const previewPerfil = ref(null);
const fotoCarta = ref(null);
const previewCarta = ref(null);
const popupMessage = ref("");
const showPopup = ref(false);
onMounted(async () => {
  sessionMail.value = localStorage.getItem("created_user");
  if (!sessionMail.value) return;

  const { data, error } = await supabase
    .from("usuarios")
    .select("username")
    .eq("email", sessionMail.value)
    .single();

  if (!error) {
    sessionUser.value = data.username;
  }
});

function validateDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return "Formato de fecha inválido";
  }

  const date = new Date(dateString);
  const [year, month, day] = dateString.split("-").map(Number);

  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return "La fecha no existe";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) {
    return "La fecha no puede ser futura";
  }

  return "";
}

function changeProfile(event) {
  const file = event.target.files[0];
  if (!file) return;

  fotoPerfil.value = file;
  previewPerfil.value = URL.createObjectURL(file);
}

function changeCard(event) {
  const file = event.target.files[0];
  if (!file) return;

  fotoCarta.value = file;
  previewCarta.value = URL.createObjectURL(file);
}

function validateFecha() {
  fechaError.value = validateDate(fechaNacimiento.value);
}

const triggerPopup = (message) => {
  popupMessage.value = message;
  showPopup.value = true;
};
async function uploadImage(file, tipo) {
  console.log("FILE:", file);
  console.log("EMAIL:", sessionMail.value);

  const ext = file.name.split(".").pop();
  const safeEmail = sessionMail.value.replace(/[@.]/g, "_");
  const fileName = `${safeEmail}_${tipo}.${ext}`;

  console.log("FILENAME:", fileName);

  const { data, error } = await supabase.storage
    .from("Fotos")
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error("UPLOAD ERROR:", error);
    return null;
  }

  const { data: publicData } = supabase.storage
    .from("Fotos")
    .getPublicUrl(fileName);

  console.log("PUBLIC URL:", publicData.publicUrl);

  return publicData.publicUrl;
}

async function updateProfile() {
  if (!validateProfileFields()) return;

  const fotoPerfilUrl = await uploadImage(fotoPerfil.value, "perfil");
  const fotoCartaUrl = await uploadImage(fotoCarta.value, "carta");
  const { data: existingEmail, error: selectError } = await supabase
    .from("perfiles")
    .select("id")
    .eq("email_usuario", sessionMail.value)
    .maybeSingle();

  if (selectError) {
    console.error(selectError);
    triggerPopup("Error comprobando el email");
    return;
  }

  if (existingEmail) {
    triggerPopup("Este email ya está registrado");
    return;
  }

  const { error: insertError } = await supabase.from("perfiles").insert([
    {
      email_usuario: sessionMail.value,
      fecha_nacimiento: fechaNacimiento.value,
      genero: genero.value,
      preferencia_genero: generoPreferido.value,
      biografia: biografia.value,
      localizacion: localizacion.value,
      foto_perfil_url: fotoPerfilUrl,
      foto_carta_url: fotoCartaUrl,
    },
  ]);

  if (insertError) {
    console.error(insertError);
    triggerPopup("Error al crear el perfil");
    return;
  }

  localStorage.clear();
  localStorage.setItem("session_email", sessionMail.value);

  triggerPopup("Perfil creado exitosamente");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  router.push("/home");
}
function validateProfileFields() {
  fechaError.value = validateDate(fechaNacimiento.value);
  if (fechaError.value) {
    triggerPopup(fechaError.value);
    return false;
  }

  if (!genero.value) {
    triggerPopup("Por favor selecciona tu género");
    return false;
  }
  if (!generoPreferido.value) {
    triggerPopup("Por favor selecciona tu género preferido");
    return false;
  }
  if (!biografia.value.trim()) {
    triggerPopup("La biografía no puede estar vacía");
    return false;
  }
  if (!localizacion.value) {
    triggerPopup("Por favor selecciona tu localización");
    return false;
  }
  if (!fotoPerfil.value) {
    triggerPopup("Por favor sube tu foto de perfil");
    return false;
  }
  if (!fotoCarta.value) {
    triggerPopup("Por favor sube tu foto de carta");
    return false;
  }

  return true;
}
watch(fechaNacimiento, validateFecha);
</script>

<template>
  <Popup
    v-if="showPopup"
    :message="popupMessage"
    :duration="3000"
    @close="showPopup = false"
  />
  <div v-if="sessionUser">
    <p class="mb-6 text-lg">
      Hola <u>{{ sessionUser }}</u
      >, cuéntanos un poco sobre ti
    </p>

    <form class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div class="space-y-6">
        <div class="max-w-sm space-y-2">
          <label class="block font-medium text-gray-700">
            ¿Cuándo viniste a este mundo?
          </label>

          <input
            type="date"
            v-model="fechaNacimiento"
            class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
            :class="
              fechaError
                ? 'border-red-500 focus:ring-red-400'
                : 'border-gray-300 focus:ring-[#e3a587]'
            "
          />

          <p v-if="fechaError" class="text-sm text-red-600">
            {{ fechaError }}
          </p>
        </div>

        <div class="max-w-sm space-y-2">
          <label class="block font-medium text-gray-700">
            ¿Con cuál te identificas?
          </label>

          <div class="flex gap-6">
            <label class="flex items-center gap-2">
              <input type="radio" value="hombre" v-model="genero" />
              Hombre
            </label>

            <label class="flex items-center gap-2">
              <input type="radio" value="mujer" v-model="genero" />
              Mujer
            </label>
          </div>
        </div>

        <div class="max-w-sm space-y-2">
          <label class="block font-medium text-gray-700">
            ¿Qué género te atrae más?
          </label>

          <div class="flex gap-6">
            <label class="flex items-center gap-2">
              <input type="radio" value="hombres" v-model="generoPreferido" />
              Hombres
            </label>

            <label class="flex items-center gap-2">
              <input type="radio" value="mujeres" v-model="generoPreferido" />
              Mujeres
            </label>

            <label class="flex items-center gap-2">
              <input type="radio" value="ambos" v-model="generoPreferido" />
              Ambos
            </label>
          </div>
        </div>

        <div class="max-w-sm space-y-2">
          <label class="block font-medium text-gray-700">
            Cuéntanos algo sobre ti
          </label>

          <textarea
            v-model="biografia"
            rows="4"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#e3a587]"
          ></textarea>
        </div>

        <div class="max-w-sm space-y-2">
          <label class="block font-medium text-gray-700">
            ¿De dónde eres?
          </label>

          <select
            v-model="localizacion"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#e3a587]"
          >
            <option value="" disabled>Selecciona una localidad</option>

            <option
              v-for="ciudad in localizacionesProvinciaMadrid"
              :key="ciudad"
              :value="ciudad"
            >
              {{ ciudad }}
            </option>
          </select>
        </div>
      </div>

      <div class="space-y-6">
        <div class="max-w-sm space-y-2">
          <label class="block font-medium text-gray-700">
            Foto de perfil
          </label>

          <input
            type="file"
            accept="image/*"
            @change="changeProfile"
            class="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#e3a587] file:px-4 file:py-2 file:text-white hover:file:bg-[#d08a66]"
          />

          <img
            v-if="previewPerfil"
            :src="previewPerfil"
            alt="Preview foto perfil"
            class="mt-2 h-32 w-32 rounded-full object-cover border"
          />
        </div>

        <div class="max-w-sm space-y-2">
          <label class="block font-medium text-gray-700">
            Foto de tu carta
          </label>

          <input
            type="file"
            accept="image/*"
            @change="changeCard"
            class="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#e3a587] file:px-4 file:py-2 file:text-white hover:file:bg-[#d08a66]"
          />

          <img
            v-if="previewCarta"
            :src="previewCarta"
            alt="Preview foto carta"
            class="mt-2 h-48 w-32 rounded-lg object-cover border"
          />
        </div>
      </div>

      <div class="lg:col-span-2">
        <button
          type="button"
          class="rounded-lg bg-[#c9684a] px-6 py-2 text-white hover:bg-[#a85230]"
          @click="updateProfile"
        >
          Crear perfil
        </button>
      </div>
    </form>
  </div>

  <div v-else>Espere un momento…</div>
</template>
