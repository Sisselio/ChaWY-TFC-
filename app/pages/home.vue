<script setup>
import { ref, onMounted, computed } from "vue";

const supabase = useSupabaseClient();
const loading = ref(true);
const showChat = ref(false);
const perfiles = ref([]);
const currentIndex = ref(0);
const myProfile = ref(null);
const sessionMail = ref(null);
function toggleChat() {
  showChat.value = !showChat.value;
}

function plural(g) {
  if (g === "hombre") return "hombres";
  if (g === "mujer") return "mujeres";
  return g;
}

function calcularEdad(fechaNacimiento) {
  const birth = new Date(fechaNacimiento);
  const today = new Date();

  let edad = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) edad--;

  return edad;
}

onMounted(async () => {
  try {
    sessionMail.value = localStorage.getItem("session_email");

    if (!sessionMail.value) {
      loading.value = false;
      return;
    }

    const { data: yo, error: yoError } = await supabase
      .from("perfiles")
      .select("genero, preferencia_genero")
      .eq("email_usuario", sessionMail.value)
      .single();

    if (yoError || !yo) {
      loading.value = false;
      return;
    }

    myProfile.value = yo;

    const { data: perfilesData, error: perfilesError } = await supabase
      .from("perfiles")
      .select(
        `
        email_usuario,
        fecha_nacimiento,
        genero,
        preferencia_genero,
        biografia,
        localizacion,
        foto_carta_url,
        usuarios(username)
      `,
      )
      .neq("email_usuario", sessionMail.value);

    if (perfilesError) {
      loading.value = false;
      return;
    }

    perfiles.value = (perfilesData || [])
      .filter((p) => {
        const yoAcepto =
          yo.preferencia_genero === "ambos" ||
          yo.preferencia_genero === plural(p.genero);

        const elMeAcepta =
          p.preferencia_genero === "ambos" ||
          p.preferencia_genero === plural(yo.genero);

        return yoAcepto && elMeAcepta;
      })
      .map((p) => ({
        ...p,
        username: p.usuarios?.username || "Usuario",
      }));
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

const perfil = computed(() => {
  if (currentIndex.value >= perfiles.value.length) return null;
  return perfiles.value[currentIndex.value];
});

const edad = computed(() =>
  perfil.value ? calcularEdad(perfil.value.fecha_nacimiento) : null,
);

const generoIcono = computed(() => {
  if (perfil.value?.genero === "hombre") return "Hombre";
  if (perfil.value?.genero === "mujer") return "Mujer";
  return "";
});

async function guardarLike(valor) {
  const yo = sessionMail.value;
  const otro = perfil.value.email_usuario;

  const [user_a, user_b] = [yo, otro].sort();
  const yoEsA = yo === user_a;

  const { data: existente } = await supabase
    .from("likes")
    .select("*")
    .eq("user_a", user_a)
    .eq("user_b", user_b)
    .maybeSingle();

  if (!existente) {
    await supabase.from("likes").insert({
      user_a,
      user_b,
      like_a: yoEsA ? valor : null,
      like_b: yoEsA ? null : valor,
    });
    return;
  }

  const updateData = yoEsA ? { like_a: valor } : { like_b: valor };

  const { data: updated } = await supabase
    .from("likes")
    .update(updateData)
    .eq("user_a", user_a)
    .eq("user_b", user_b)
    .select()
    .single();

  if (updated.like_a === true && updated.like_b === true) {
    console.log("MATCH!");
    const { data: nuevoMatch } = await supabase
      .from("matches")
      .insert({
        user_a,
        user_b,
      })
      .select()
      .single();

    await supabase.from("chats").insert({
      match_id: nuevoMatch.id,
    });

    showChat.value = true;
  }
}

function siguiente() {
  currentIndex.value++;
}

async function aceptar() {
  await guardarLike(true);
  siguiente();
}

async function rechazar() {
  await guardarLike(false);
  siguiente();
}
</script>

<template>
  <Navbar
    :showLandingLinks="false"
    :showRegisterLinks="false"
    :showSesionLinks="false"
    :showHomeLinks="true"
  />

  <div v-if="loading" class="text-center mt-16">Cargando…</div>

  <div
    v-else-if="perfil"
    class="relative w-full h-[calc(100vh-64px)] overflow-hidden"
  >
    <div class="absolute inset-0 flex items-center justify-center">
      <div
        class="transition-transform duration-300 ease-in-out"
        :class="showChat ? '-translate-x-full' : 'translate-x-0'"
      >
        <div
          class="relative w-[340px] h-[520px] rounded-2xl overflow-hidden shadow-xl"
          :style="{
            backgroundImage: `url(${perfil.foto_carta_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }"
        >
          <div
            class="absolute top-3 left-3 bg-black/50 text-white px-3 py-1 rounded-full text-sm"
          >
            📍 {{ perfil.localizacion }}
          </div>

          <div
            class="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 text-white"
          >
            <div class="flex items-center gap-2 text-lg font-semibold">
              <span>{{ perfil.username }}</span>
              <span>{{ edad }}</span>
              <span class="ml-2"> {{ generoIcono }}</span>
            </div>

            <p class="mt-2 text-sm leading-snug">
              {{ perfil.biografia }}
            </p>

            <div class="mt-4 flex justify-between">
              <button
                @click="rechazar"
                class="w-12 h-12 rounded-full bg-red-500 text-white text-xl"
              >
                ❌
              </button>

              <button
                @click="aceptar"
                class="w-12 h-12 rounded-full bg-green-500 text-white text-xl"
              >
                ❤️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="absolute top-0 right-0 h-full w-1/2 bg-[#f6ede6] border-l border-[#e3a587] transition-transform duration-300 ease-in-out"
      :class="showChat ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="h-full flex flex-col">
        <div class="p-4 font-semibold text-[#6b3f2b] border-b">Chat</div>

        <div class="flex-1 p-4 overflow-y-auto text-sm text-gray-700">
          <p class="opacity-50">Aquí irá el chat 👀</p>
        </div>

        <div class="p-4 border-t flex gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            class="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none"
          />
          <button
            class="bg-[#c9684a] hover:bg-[#a85230] text-white px-4 py-2 rounded-lg"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>

    <button
      @click="toggleChat"
      class="fixed bottom-1 right-6 z-50 w-14 h-14 rounded-full bg-[#c9684a] hover:bg-[#a85230] text-white text-xl shadow-lg flex items-center justify-center"
    >
      💬
    </button>
  </div>
  <div
    v-else
    class="flex justify-center items-center h-full text-gray-500 text-lg"
  >
    No hay más perfiles disponibles 🙂
  </div>
</template>
