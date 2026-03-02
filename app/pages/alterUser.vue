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

const currentPerfilUrl = ref(null);
const currentCartaUrl = ref(null);

const hasNewPerfilImage = ref(false);
const hasNewCartaImage = ref(false);

onMounted(async () => {
  sessionMail.value = localStorage.getItem("session_email");
  if (!sessionMail.value) return;

  const { data: userData } = await supabase
    .from("usuarios")
    .select("username")
    .eq("email", sessionMail.value)
    .single();

  if (userData) sessionUser.value = userData.username;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("email_usuario", sessionMail.value)
    .single();

  if (perfil) {
    fechaNacimiento.value = perfil.fecha_nacimiento;
    genero.value = perfil.genero;
    generoPreferido.value = perfil.preferencia_genero;
    biografia.value = perfil.biografia;
    localizacion.value = perfil.localizacion;

    previewPerfil.value = perfil.foto_perfil_url;
    previewCarta.value = perfil.foto_carta_url;

    currentPerfilUrl.value = perfil.foto_perfil_url;
    currentCartaUrl.value = perfil.foto_carta_url;
  }
});

function validateDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return "Formato de fecha inválido";

  const date = new Date(dateString);
  const [year, month, day] = dateString.split("-").map(Number);

  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  )
    return "La fecha no existe";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) return "La fecha no puede ser futura";

  return "";
}

function changeProfile(event) {
  const file = event.target.files[0];
  if (!file) {
    hasNewPerfilImage.value = false;
    return;
  }
  fotoPerfil.value = file;
  previewPerfil.value = URL.createObjectURL(file);
  hasNewPerfilImage.value = true;
}

function changeCard(event) {
  const file = event.target.files[0];
  if (!file) {
    hasNewCartaImage.value = false;
    return;
  }
  fotoCarta.value = file;
  previewCarta.value = URL.createObjectURL(file);
  hasNewCartaImage.value = true;
}

function validateFecha() {
  fechaError.value = validateDate(fechaNacimiento.value);
}

function calcularEdad(fecha) {
  const hoy = new Date();
  const nacimiento = new Date(fecha);

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();

  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

  return edad;
}

const triggerPopup = (message) => {
  popupMessage.value = message;
  showPopup.value = true;
};

async function uploadImage(file, tipo) {
  const ext = file.name.split(".").pop();
  const safeEmail = sessionMail.value.replace(/[@.]/g, "_");
  const timestamp = Date.now();
  const fileName = `${safeEmail}_${tipo}_${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from("Fotos")
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error("Error subiendo imagen:", error);
    return null;
  }

  const { data } = supabase.storage.from("Fotos").getPublicUrl(fileName);

  return data.publicUrl;
}

async function deleteImage(url) {
  if (!url) return;

  try {
    const path = url.split("/storage/v1/object/public/Fotos/")[1];
    if (!path) return;

    const { error } = await supabase.storage.from("Fotos").remove([path]);
    if (error) {
      console.error("Error borrando imagen:", error);
    }
  } catch (err) {
    console.error("Error procesando URL de imagen:", err);
  }
}

async function updateProfile() {
  try {
    console.log("=== INICIO UPDATE PROFILE ===");
    console.log("hasNewPerfilImage:", hasNewPerfilImage.value);
    console.log("fotoPerfil:", fotoPerfil.value);
    console.log("hasNewCartaImage:", hasNewCartaImage.value);
    console.log("fotoCarta:", fotoCarta.value);
    console.log("currentPerfilUrl:", currentPerfilUrl.value);
    console.log("currentCartaUrl:", currentCartaUrl.value);

    let fotoPerfilUrl = currentPerfilUrl.value;
    let fotoCartaUrl = currentCartaUrl.value;

    // Solo procesar foto de perfil si hay una nueva imagen seleccionada
    if (hasNewPerfilImage.value && fotoPerfil.value) {
      console.log("=== SUBIENDO FOTO PERFIL ===");
      const nuevaUrl = await uploadImage(fotoPerfil.value, "perfil");
      console.log("Nueva URL perfil:", nuevaUrl);

      if (nuevaUrl) {
        if (currentPerfilUrl.value) {
          console.log(
            "Borrando foto antigua de perfil:",
            currentPerfilUrl.value,
          );
          await deleteImage(currentPerfilUrl.value);
        }
        fotoPerfilUrl = nuevaUrl;
        console.log("fotoPerfilUrl actualizada a:", fotoPerfilUrl);
      } else {
        triggerPopup("Error al subir la foto de perfil");
        return;
      }
    }

    // Solo procesar foto de carta si hay una nueva imagen seleccionada
    if (hasNewCartaImage.value && fotoCarta.value) {
      console.log("=== SUBIENDO FOTO CARTA ===");
      const nuevaUrl = await uploadImage(fotoCarta.value, "carta");
      console.log("Nueva URL carta:", nuevaUrl);

      if (nuevaUrl) {
        if (currentCartaUrl.value) {
          console.log("Borrando foto antigua de carta:", currentCartaUrl.value);
          await deleteImage(currentCartaUrl.value);
        }
        fotoCartaUrl = nuevaUrl;
        console.log("fotoCartaUrl actualizada a:", fotoCartaUrl);
      } else {
        triggerPopup("Error al subir la foto de carta");
        return;
      }
    }

    console.log("=== ACTUALIZANDO BD ===");
    console.log("Datos a guardar:", {
      email_usuario: sessionMail.value,
      fecha_nacimiento: fechaNacimiento.value,
      genero: genero.value,
      preferencia_genero: generoPreferido.value,
      biografia: biografia.value,
      localizacion: localizacion.value,
      foto_perfil_url: fotoPerfilUrl,
      foto_carta_url: fotoCartaUrl,
    });

    const { data, error } = await supabase
      .from("perfiles")
      .update({
        email_usuario: sessionMail.value,
        fecha_nacimiento: fechaNacimiento.value,
        genero: genero.value,
        preferencia_genero: generoPreferido.value,
        biografia: biografia.value,
        localizacion: localizacion.value,
        foto_perfil_url: fotoPerfilUrl,
        foto_carta_url: fotoCartaUrl,
      })
      .eq("email_usuario", sessionMail.value)
      .select(); // IMPORTANTE: añadir .select() para ver qué se guardó

    console.log("Resultado BD:", data);
    console.log("Error BD:", error);

    if (error) throw error;

    // Actualizar las URLs actuales y resetear TODO
    currentPerfilUrl.value = fotoPerfilUrl;
    currentCartaUrl.value = fotoCartaUrl;
    fotoPerfil.value = null;
    fotoCarta.value = null;
    hasNewPerfilImage.value = false;
    hasNewCartaImage.value = false;

    console.log("=== PERFIL ACTUALIZADO ===");
    triggerPopup("Perfil actualizado correctamente");
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    triggerPopup("Error al actualizar el perfil");
  }
}
async function deleteUser() {
  try {
    console.log("=== INICIANDO BORRADO DE USUARIO ===");

    if (!sessionMail.value) {
      triggerPopup("No hay sesión activa");
      return;
    }

    const confirmacion1 = confirm(
      "⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE.\n\n" +
        "Se eliminará permanentemente:\n" +
        "- Tu perfil y toda tu información personal\n" +
        "- Tus fotos\n" +
        "- Todos tus likes (dados y recibidos)\n" +
        "- Todos tus matches\n" +
        "- Tu cuenta de usuario\n\n" +
        "¿Estás COMPLETAMENTE seguro?",
    );

    if (!confirmacion1) return;

    const confirmacion2 = confirm(
      "⚠️ ÚLTIMA CONFIRMACIÓN\n\n" +
        "Escribe tu email mentalmente: " +
        sessionMail.value +
        "\n\n" +
        "¿Confirmas que quieres borrar PERMANENTEMENTE esta cuenta?",
    );

    if (!confirmacion2) return;

    console.log("Usuario confirmó el borrado");

    console.log("=== BORRANDO FOTOS ===");
    if (currentPerfilUrl.value) {
      console.log("Borrando foto de perfil:", currentPerfilUrl.value);
      await deleteImage(currentPerfilUrl.value);
    }
    if (currentCartaUrl.value) {
      console.log("Borrando foto de carta:", currentCartaUrl.value);
      await deleteImage(currentCartaUrl.value);
    }

    console.log("=== BORRANDO LIKES (userA) ===");
    const { error: errorLikesA } = await supabase
      .from("likes")
      .delete()
      .eq("user_a", sessionMail.value);

    if (errorLikesA) {
      console.error("Error borrando likes userA:", errorLikesA);
      throw errorLikesA;
    }

    console.log("=== BORRANDO LIKES (userB) ===");
    const { error: errorLikesB } = await supabase
      .from("likes")
      .delete()
      .eq("user_b", sessionMail.value);

    if (errorLikesB) {
      console.error("Error borrando likes userB:", errorLikesB);
      throw errorLikesB;
    }
    console.log("=== BORRANDO LIKES (userA) ===");
    const { error: errorMatchesA } = await supabase
      .from("matches")
      .delete()
      .eq("user_a", sessionMail.value);

    if (errorMatchesA) {
      console.error("Error borrando matches userA:", errorMatchesA);
      throw errorMatchesA;
    }

    console.log("=== BORRANDO matches (userB) ===");
    const { error: errorMatchesB } = await supabase
      .from("matches")
      .delete()
      .eq("user_b", sessionMail.value);

    if (errorMatchesB) {
      console.error("Error borrando matches userB:", errorMatchesB);
      throw errorMatchesB;
    }
    console.log("=== BORRANDO PERFIL ===");
    const { error: errorPerfil } = await supabase
      .from("perfiles")
      .delete()
      .eq("email_usuario", sessionMail.value);

    if (errorPerfil) {
      console.error("Error borrando perfil:", errorPerfil);
      throw errorPerfil;
    }

    console.log("=== BORRANDO USUARIO ===");
    const { error: errorUsuario } = await supabase
      .from("usuarios")
      .delete()
      .eq("email", sessionMail.value);

    if (errorUsuario) {
      console.error("Error borrando usuario:", errorUsuario);
      throw errorUsuario;
    }

    console.log("=== USUARIO BORRADO EXITOSAMENTE ===");

    localStorage.removeItem("session_email");
    sessionMail.value = null;
    sessionUser.value = null;

    alert("Tu cuenta ha sido eliminada permanentemente. Adiós 👋");

    router.push("/");
  } catch (error) {
    console.error("❌ ERROR CRÍTICO borrando usuario:", error);
    triggerPopup("Error al borrar la cuenta: " + error.message);
  }
}
watch(fechaNacimiento, validateFecha);
</script>
<template>
  <Navbar
    :showLandingLinks="false"
    :showRegisterLinks="false"
    :showSesionLinks="false"
    :showHomeLinks="false"
    :showAlterLinks="true"
  />
  <Popup
    v-if="showPopup"
    :message="popupMessage"
    :duration="3000"
    @close="showPopup = false"
  />

  <div v-if="sessionMail" class="max-w-7xl mx-auto px-6 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Editar perfil</h1>
      <p class="text-gray-500">
        Actualiza tu información y cómo te verán los demás
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      <form class="space-y-8">
        <div class="bg-white rounded-2xl shadow p-6 space-y-6">
          <h2 class="font-semibold text-lg">Información personal</h2>

          <div>
            <label class="block text-sm font-medium mb-1">
              Fecha nacimiento
            </label>

            <input
              type="date"
              v-model="fechaNacimiento"
              class="w-full rounded-lg border px-3 py-2"
            />

            <p v-if="fechaError" class="text-sm text-red-500">
              {{ fechaError }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Género</label>

            <div class="flex gap-6">
              <label>
                <input type="radio" value="hombre" v-model="genero" />
                Hombre
              </label>

              <label>
                <input type="radio" value="mujer" v-model="genero" />
                Mujer
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Me atraen</label>

            <div class="flex gap-6">
              <label>
                <input type="radio" value="hombres" v-model="generoPreferido" />
                Hombres
              </label>

              <label>
                <input type="radio" value="mujeres" v-model="generoPreferido" />
                Mujeres
              </label>

              <label>
                <input type="radio" value="ambos" v-model="generoPreferido" />
                Ambos
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Biografía</label>

            <textarea
              v-model="biografia"
              rows="4"
              class="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Localización</label>

            <select
              v-model="localizacion"
              class="w-full rounded-lg border px-3 py-2"
            >
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

        <div class="space-y-3">
          <button
            type="button"
            @click="updateProfile"
            class="w-full rounded-xl bg-[#c9684a] py-3 text-white font-semibold hover:bg-[#a85230] transition"
          >
            Guardar cambios
          </button>

          <button
            type="button"
            @click="deleteUser"
            class="w-full rounded-xl bg-red-600 py-3 text-white font-semibold hover:bg-red-700 transition border-2 border-red-700"
          >
            🗑️ Borrar cuenta permanentemente
          </button>
        </div>
      </form>

      <div class="bg-white rounded-2xl shadow p-6 space-y-6">
        <h2 class="font-semibold text-lg">Fotos</h2>

        <div class="flex flex-col gap-8">
          <div>
            <label class="block text-sm font-medium mb-2"> Foto perfil </label>

            <img
              v-if="previewPerfil"
              :src="previewPerfil"
              class="h-24 w-24 rounded-full object-cover border mb-3"
            />

            <input type="file" accept="image/*" @change="changeProfile" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2"> Foto carta </label>

            <img
              v-if="previewCarta"
              :src="previewCarta"
              class="h-40 w-28 rounded-lg object-cover border mb-3"
            />

            <input type="file" accept="image/*" @change="changeCard" />
          </div>
        </div>
      </div>

      <div class="flex justify-center lg:sticky lg:top-8">
        <div
          class="relative w-[260px] h-[420px] rounded-2xl overflow-hidden shadow-xl border bg-gray-300"
          :style="{
            backgroundImage:
              previewCarta || previewPerfil
                ? `url(${previewCarta || previewPerfil})`
                : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }"
        >
          <div
            class="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs"
          >
            📍 {{ localizacion || "Sin ubicación" }}
          </div>

          <div
            class="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 text-white"
          >
            <div class="flex items-center gap-2 font-semibold">
              <span>{{ sessionUser }}</span>

              <span v-if="fechaNacimiento">
                {{ calcularEdad(fechaNacimiento) }}
              </span>

              <span>
                {{
                  genero === "hombre" ? "♂️" : genero === "mujer" ? "♀️" : ""
                }}
              </span>
            </div>

            <p class="mt-2 text-xs">
              {{ biografia || "Tu biografía aparecerá aquí..." }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-20 text-gray-500">Cargando perfil...</div>
</template>
