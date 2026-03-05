<script setup>
import { ref, onMounted, computed, nextTick } from "vue";

const supabase = useSupabaseClient();
const loading = ref(true);
const showChat = ref(false);
const showMatchPopup = ref(false);
const matchProfile = ref(null);
const perfiles = ref([]);
const currentIndex = ref(0);
const myProfile = ref(null);
const sessionMail = ref(null);
const chats = ref([]);
const chatSeleccionado = ref(null);
const mensajes = ref([]);
const nuevoMensaje = ref("");
const mensajesContainer = ref(null);
let mensajesChannel = null;

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

async function seleccionarChat(chat) {
  chatSeleccionado.value = chat;
  localStorage.setItem("chat_seleccionado_id", chat.chat_id);

  await cargarMensajes(chat.chat_id);

  if (mensajesChannel) {
    supabase.removeChannel(mensajesChannel);
  }

  mensajesChannel = supabase
    .channel(`messages-chat-${chat.chat_id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chat.chat_id}`,
      },
      (payload) => {
        const yaExiste = mensajes.value.some(
          (m) =>
            m.from_user === payload.new.from_user &&
            m.content === payload.new.content &&
            String(m.id).startsWith("temp-"),
        );

        if (yaExiste) {
          const idx = mensajes.value.findIndex(
            (m) =>
              m.from_user === payload.new.from_user &&
              m.content === payload.new.content &&
              String(m.id).startsWith("temp-"),
          );
          mensajes.value.splice(idx, 1, payload.new);
        } else {
          mensajes.value.push(payload.new);
          scrollAbajo();
        }
      },
    )
    .subscribe();
}

async function cargarMensajes(chatId) {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId);

  mensajes.value = data || [];
  scrollAbajo();
}

async function enviarMensaje() {
  const contenido = nuevoMensaje.value.trim();
  if (!contenido || !chatSeleccionado.value) return;

  nuevoMensaje.value = "";

  const mensajeTemporal = {
    id: `temp-${Date.now()}`,
    chat_id: chatSeleccionado.value.chat_id,
    from_user: sessionMail.value,
    content: contenido,
  };

  mensajes.value.push(mensajeTemporal);
  scrollAbajo();

  await supabase.from("messages").insert({
    chat_id: chatSeleccionado.value.chat_id,
    from_user: sessionMail.value,
    content: contenido,
  });
}

async function scrollAbajo() {
  await nextTick();
  if (mensajesContainer.value) {
    mensajesContainer.value.scrollTop = mensajesContainer.value.scrollHeight;
  }
}

async function cargarChats() {
  if (!sessionMail.value) return;

  const { data: misMatches } = await supabase
    .from("matches")
    .select("id, user_a, user_b")
    .or(`user_a.eq.${sessionMail.value},user_b.eq.${sessionMail.value}`);

  if (!misMatches?.length) return;

  const matchIds = misMatches.map((m) => m.id);

  const { data } = await supabase
    .from("chats")
    .select("id, match_id")
    .in("match_id", matchIds);

  const lista = [];

  for (const chat of data || []) {
    const match = misMatches.find((m) => m.id === chat.match_id);
    if (!match) continue;

    const otroEmail =
      match.user_a === sessionMail.value ? match.user_b : match.user_a;

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("foto_carta_url, usuarios(username)")
      .eq("email_usuario", otroEmail)
      .single();

    lista.push({
      chat_id: chat.id,
      email: otroEmail,
      username: perfil?.usuarios?.username || "Usuario",
      foto: perfil?.foto_carta_url || "",
    });
  }

  chats.value.splice(0, chats.value.length, ...lista);

  const chatGuardadoId = localStorage.getItem("chat_seleccionado_id");
  if (chatGuardadoId && !chatSeleccionado.value) {
    const chatRestaurado = lista.find(
      (c) => String(c.chat_id) === chatGuardadoId,
    );
    if (chatRestaurado) {
      await seleccionarChat(chatRestaurado);
    }
  }
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

    const { data: misMatches } = await supabase
      .from("matches")
      .select("user_a,user_b")
      .or(`user_a.eq.${sessionMail.value},user_b.eq.${sessionMail.value}`);

    const emailsExcluidos = new Set();

    (misMatches || []).forEach((m) => {
      if (m.user_a === sessionMail.value) emailsExcluidos.add(m.user_b);
      if (m.user_b === sessionMail.value) emailsExcluidos.add(m.user_a);
    });

    const { data: perfilesData, error: perfilesError } = await supabase
      .from("perfiles")
      .select(
        `email_usuario, fecha_nacimiento, genero, preferencia_genero,
         biografia, localizacion, foto_carta_url, usuarios(username)`,
      )
      .neq("email_usuario", sessionMail.value);

    if (perfilesError) {
      loading.value = false;
      return;
    }

    perfiles.value = (perfilesData || [])
      .filter((p) => {
        if (emailsExcluidos.has(p.email_usuario)) return false;
        const yoAcepto =
          yo.preferencia_genero === "ambos" ||
          yo.preferencia_genero === plural(p.genero);
        const elMeAcepta =
          p.preferencia_genero === "ambos" ||
          p.preferencia_genero === plural(yo.genero);
        return yoAcepto && elMeAcepta;
      })
      .map((p) => ({ ...p, username: p.usuarios?.username || "Usuario" }));

    await cargarChats();

    supabase
      .channel("realtime-chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        async () => {
          await cargarChats();
        },
      )
      .subscribe();
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
    const { data: nuevoMatch } = await supabase
      .from("matches")
      .insert({ user_a, user_b })
      .select()
      .single();

    await supabase.from("chats").insert({ match_id: nuevoMatch.id });

    matchProfile.value = perfil.value;
    showMatchPopup.value = true;

    await cargarChats();
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

  <div class="relative w-full h-[calc(100vh-76px)] overflow-hidden">
    <div v-if="loading" class="text-center mt-16">Cargando…</div>

    <div
      v-else-if="perfil"
      class="absolute inset-0 flex items-start md:items-center justify-center"
    >
      <div
        class="transition-transform duration-300 ease-in-out mt-[76px] md:mt-0"
        :class="{
          'translate-x-0': !showChat,
          'md:-translate-x-full': showChat,
        }"
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
              <span class="ml-2">{{ generoIcono }}</span>
            </div>
            <p class="mt-2 text-sm leading-snug">{{ perfil.biografia }}</p>

            <div class="mt-4 flex justify-between">
              <button
                @click="rechazar"
                class="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <Icon
                  name="maki:cross"
                  class="w-2/3 h-2/3 text-white bg-black"
                />
              </button>
              <button
                @click="aceptar"
                class="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center"
              >
                <Icon
                  name="mynaui:heart-solid"
                  class="w-2/3 h-2/3 text-white bg-red-600"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="!loading"
      class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm"
    >
      No hay más perfiles disponibles por ahora 😕
    </div>

    <div
      class="absolute top-[76px] right-0 h-[calc(100%-76px)] w-full md:w-1/2 bg-[#f6ede6] border-l border-[#e3a587] transition-transform duration-300 ease-in-out"
      :class="
        showChat ? 'translate-x-0' : 'translate-x-full md:translate-x-full'
      "
    >
      <div class="h-full flex">
        <div class="w-1/3 border-r overflow-y-auto bg-white">
          <div
            v-for="chat in chats"
            :key="chat.chat_id"
            @click="seleccionarChat(chat)"
            class="flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-[#f6ede6] transition-colors"
            :class="{
              'bg-[#f6ede6] border-l-4 border-l-[#c9684a]':
                chatSeleccionado?.chat_id === chat.chat_id,
            }"
          >
            <img :src="chat.foto" class="w-10 h-10 rounded-full object-cover" />
            <div class="flex flex-col">
              <span class="font-semibold text-sm">{{ chat.username }}</span>
            </div>
          </div>
        </div>

        <div class="w-2/3 flex flex-col">
          <div
            class="p-4 font-semibold text-[#6b3f2b] border-b bg-white flex items-center gap-3"
          >
            <template v-if="chatSeleccionado">
              <img
                :src="chatSeleccionado.foto"
                class="w-8 h-8 rounded-full object-cover"
              />
              {{ chatSeleccionado.username }}
            </template>
            <template v-else>Selecciona un chat</template>
          </div>

          <div
            ref="mensajesContainer"
            class="flex-1 p-4 overflow-y-auto flex flex-col gap-2"
          >
            <template v-if="chatSeleccionado">
              <div
                v-for="msg in mensajes"
                :key="msg.id"
                class="flex"
                :class="
                  msg.from_user === sessionMail
                    ? 'justify-end'
                    : 'justify-start'
                "
              >
                <div
                  class="max-w-[75%] px-3 py-2 rounded-2xl text-sm"
                  :class="
                    msg.from_user === sessionMail
                      ? 'bg-[#c9684a] text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                  "
                >
                  {{ msg.content }}
                </div>
              </div>
            </template>
            <div v-else class="text-center text-gray-400 mt-8 text-sm">
              Elige una conversación para empezar a chatear 💬
            </div>
          </div>

          <div class="p-4 border-t bg-white flex gap-2">
            <input
              v-model="nuevoMensaje"
              type="text"
              placeholder="Escribe un mensaje..."
              class="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-[#c9684a]"
              :disabled="!chatSeleccionado"
              @keyup.enter="enviarMensaje"
            />
            <button
              @click="enviarMensaje"
              :disabled="!chatSeleccionado"
              class="bg-[#c9684a] hover:bg-[#a85230] disabled:opacity-40 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>

    <button
      @click="toggleChat"
      class="fixed bottom-1 right-6 z-50 w-14 h-14 rounded-full bg-[#c9684a] hover:bg-[#a85230] text-white text-xl shadow-lg flex items-center justify-center"
    >
      <Icon name="tabler:message-filled" class="w-2/3 h-2/3 text-white" />
    </button>

    <div
      v-if="showMatchPopup"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
    >
      <div class="bg-white rounded-2xl p-6 w-[320px] text-center shadow-2xl">
        <h2 class="text-2xl font-bold text-[#c9684a] mb-4">¡Es un Match! 💖</h2>
        <img
          :src="matchProfile?.foto_carta_url"
          class="w-24 h-24 rounded-full mx-auto object-cover border-4 border-[#c9684a]"
        />
        <p class="mt-4 text-gray-700">
          Tú y <strong>{{ matchProfile?.username }}</strong> os gustáis
          mutuamente.
        </p>
        <div class="mt-6 flex gap-3 justify-center">
          <button
            @click="showMatchPopup = false"
            class="px-4 py-2 rounded-lg border"
          >
            Seguir viendo
          </button>
          <button
            @click="
              () => {
                showMatchPopup = false;
                showChat = true;
              }
            "
            class="px-4 py-2 rounded-lg bg-[#c9684a] text-white"
          >
            Ir al chat
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
