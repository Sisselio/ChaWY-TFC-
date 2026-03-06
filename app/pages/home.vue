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

  <div
    class="relative w-full h-[calc(100dvh-76px)] overflow-hidden bg-[#fdf5f0]"
  >
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3">
        <div
          class="w-8 h-8 rounded-full border-2 border-[#c9684a] border-t-transparent animate-spin"
        />
        <span class="text-sm text-[#a0715e]">Cargando perfiles…</span>
      </div>
    </div>

    <div
      v-else-if="perfil"
      class="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out"
      :class="
        showChat ? 'md:-translate-x-1/4 -translate-x-full' : 'translate-x-0'
      "
    >
      <div
        class="relative w-[320px] sm:w-[360px] h-[500px] sm:h-[540px] rounded-3xl overflow-hidden shadow-2xl"
        :style="{
          backgroundImage: `url(${perfil.foto_carta_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }"
      >
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20"
        />

        <div class="absolute top-4 left-4">
          <span
            class="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full"
          >
            📍 {{ perfil.localizacion }}
          </span>
        </div>

        <div class="absolute bottom-0 w-full p-5 text-white">
          <div class="flex items-end justify-between mb-2">
            <div>
              <h2 class="text-xl font-bold leading-tight">
                {{ perfil.username }}, {{ edad }}
              </h2>
              <p class="text-xs text-white/70 mt-0.5">{{ generoIcono }}</p>
            </div>
          </div>
          <p class="text-sm text-white/85 leading-relaxed line-clamp-2 mb-5">
            {{ perfil.biografia }}
          </p>

          <div class="flex items-center justify-center gap-8">
            <button
              @click="rechazar"
              class="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-red-500/80 hover:border-red-400 active:scale-95 transition-all duration-200"
              aria-label="Rechazar perfil"
            >
              <Icon name="maki:cross" class="w-5 h-5 text-white" />
            </button>
            <button
              @click="aceptar"
              class="w-16 h-16 rounded-full bg-[#c9684a] flex items-center justify-center shadow-lg shadow-[#c9684a]/40 hover:bg-[#b85a3d] active:scale-95 transition-all duration-200"
              aria-label="Dar like"
            >
              <Icon name="mynaui:heart-solid" class="w-7 h-7 text-white" />
            </button>
            <div class="w-14 h-14" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="!loading"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-8"
    >
      <span class="text-4xl">:(</span>
      <p class="text-[#6b3f2b] font-medium">No hay más perfiles disponibles</p>
      <p class="text-sm text-[#a0715e]">
        Vuelve más tarde para ver nuevas personas
      </p>
    </div>

    <div
      class="fixed inset-y-0 right-0 w-full md:w-[50%] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out z-40"
      :style="{ top: '76px', height: 'calc(100dvh - 76px)' }"
      :class="showChat ? 'translate-x-0' : 'translate-x-full'"
    >
      <div
        class="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#f0e0d6] bg-white shrink-0"
      >
        <button
          v-if="chatSeleccionado"
          @click="chatSeleccionado = null"
          class="flex items-center gap-1.5 text-[#c9684a] text-sm font-medium"
          aria-label="Volver a la lista de chats"
        >
          <Icon name="tabler:arrow-left" class="w-4 h-4" />
          Chats
        </button>
        <button
          v-else
          @click="toggleChat"
          class="flex items-center gap-1.5 text-[#c9684a] text-sm font-medium"
          aria-label="Cerrar chat"
        >
          <Icon name="tabler:arrow-left" class="w-4 h-4" />
          Volver
        </button>

        <template v-if="chatSeleccionado">
          <img
            :src="chatSeleccionado.foto"
            class="w-8 h-8 rounded-full object-cover ring-2 ring-[#e3a587]"
            alt=""
          />
          <span class="font-semibold text-[#3d2314] text-sm truncate">{{
            chatSeleccionado.username
          }}</span>
        </template>
        <span v-else class="font-semibold text-[#3d2314] text-sm"
          >Mensajes</span
        >
      </div>

      <div class="flex flex-1 min-h-0">
        <div
          class="flex flex-col border-r border-[#f0e0d6] bg-[#fdf5f0] shrink-0 transition-all duration-300"
          :class="
            chatSeleccionado
              ? 'hidden md:flex md:w-[260px]'
              : 'w-full md:w-[260px]'
          "
        >
          <div
            class="hidden md:flex items-center justify-between px-5 py-4 border-b border-[#f0e0d6]"
          >
            <h3
              class="font-semibold text-[#3d2314] text-sm tracking-wide uppercase"
            >
              Mensajes
            </h3>
            <button
              @click="toggleChat"
              class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f0e0d6] transition-colors"
              aria-label="Cerrar panel de chat"
            >
              <Icon name="tabler:x" class="w-4 h-4 text-[#a0715e]" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div
              v-if="!chats.length"
              class="flex flex-col items-center justify-center h-full gap-3 px-6 text-center py-12"
            >
              <p class="text-sm text-[#a0715e] leading-relaxed">
                Cuando tengas un match aparecerá aquí tu conversación
              </p>
            </div>

            <button
              v-for="chat in chats"
              :key="chat.chat_id"
              @click="seleccionarChat(chat)"
              class="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#f0e0d6] hover:bg-white transition-colors text-left"
              :class="
                chatSeleccionado?.chat_id === chat.chat_id
                  ? 'bg-white border-l-[3px] border-l-[#c9684a]'
                  : ''
              "
              :aria-label="`Abrir chat con ${chat.username}`"
              :aria-current="
                chatSeleccionado?.chat_id === chat.chat_id ? 'true' : 'false'
              "
            >
              <div class="relative shrink-0">
                <img
                  :src="chat.foto"
                  class="w-11 h-11 rounded-full object-cover"
                  :alt="chat.username"
                />
                <span
                  class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-white"
                />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="font-semibold text-sm text-[#3d2314] truncate">{{
                  chat.username
                }}</span>
                <span class="text-xs text-[#a0715e] truncate"
                  >Toca para chatear</span
                >
              </div>
            </button>
          </div>
        </div>

        <div
          class="flex flex-col flex-1 min-w-0 min-h-0"
          :class="chatSeleccionado ? 'flex' : 'hidden md:flex'"
        >
          <div
            class="hidden md:flex items-center gap-3 px-5 py-3.5 border-b border-[#f0e0d6] bg-white shrink-0"
          >
            <template v-if="chatSeleccionado">
              <img
                :src="chatSeleccionado.foto"
                class="w-9 h-9 rounded-full object-cover ring-2 ring-[#e3a587]"
                alt=""
              />
              <div class="flex flex-col min-w-0">
                <span class="font-semibold text-sm text-[#3d2314] truncate">{{
                  chatSeleccionado.username
                }}</span>
                <span class="text-xs text-green-500">En línea</span>
              </div>
            </template>
            <template v-else>
              <span class="text-sm text-[#a0715e]"
                >Selecciona una conversación</span
              >
            </template>
          </div>

          <div
            ref="mensajesContainer"
            class="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-[#fdf5f0]"
          >
            <template v-if="chatSeleccionado && mensajes.length">
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
                  class="max-w-[78%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  :class="
                    msg.from_user === sessionMail
                      ? 'bg-[#c9684a] text-white rounded-br-sm shadow-sm shadow-[#c9684a]/20'
                      : 'bg-white text-[#3d2314] rounded-bl-sm shadow-sm'
                  "
                >
                  {{ msg.content }}
                </div>
              </div>
            </template>

            <div
              v-else-if="chatSeleccionado && !mensajes.length"
              class="flex-1 flex flex-col items-center justify-center gap-2 text-center py-12"
            >
              <p class="text-sm text-[#a0715e]">
                ¡Di hola a {{ chatSeleccionado.username }}!
              </p>
            </div>

            <div
              v-else
              class="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12"
            >
              <p class="text-sm text-[#a0715e]">
                Elige una conversación para empezar a chatear
              </p>
            </div>
          </div>

          <div
            class="px-4 py-3 border-t border-[#f0e0d6] bg-white shrink-0"
            style="padding-bottom: max(12px, env(safe-area-inset-bottom))"
          >
            <div class="flex items-center gap-2">
              <input
                v-model="nuevoMensaje"
                type="text"
                placeholder="Escribe un mensaje…"
                class="flex-1 min-w-0 bg-[#fdf5f0] border border-[#e3c4b3] rounded-2xl px-4 py-2.5 text-sm text-[#3d2314] placeholder-[#c4a090] focus:outline-none focus:border-[#c9684a] focus:ring-2 focus:ring-[#c9684a]/10 transition-all"
                :disabled="!chatSeleccionado"
                @keyup.enter="enviarMensaje"
                aria-label="Escribe un mensaje"
              />
              <button
                @click="enviarMensaje"
                :disabled="!chatSeleccionado || !nuevoMensaje.trim()"
                class="shrink-0 w-10 h-10 rounded-full bg-[#c9684a] flex items-center justify-center disabled:opacity-40 hover:bg-[#b85a3d] active:scale-95 transition-all duration-150 shadow-sm"
                aria-label="Enviar mensaje"
              >
                <Icon
                  name="tabler:send"
                  class="w-4 h-4 text-white translate-x-px"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button
      @click="toggleChat"
      class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#c9684a] hover:bg-[#b85a3d] active:scale-95 text-white shadow-xl shadow-[#c9684a]/30 items-center justify-center transition-all duration-200"
      :class="showChat ? 'hidden' : 'flex'"
      aria-label="Abrir mensajes"
    >
      <Icon name="tabler:message-filled" class="w-6 h-6 text-white" />
    </button>

    <div
      v-if="showMatchPopup"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
    >
      <div
        class="bg-white rounded-3xl p-7 w-full max-w-[320px] text-center shadow-2xl"
      >
        <div
          class="w-16 h-16 rounded-full bg-[#fdf5f0] flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-3xl"></span>
        </div>
        <h2 id="match-title" class="text-2xl font-bold text-[#3d2314] mb-1">
          ¡Es un Match!
        </h2>
        <p class="text-sm text-[#a0715e] mb-5">Os gustáis mutuamente</p>
        <img
          :src="matchProfile?.foto_carta_url"
          class="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-[#c9684a] ring-offset-2"
          :alt="matchProfile?.username"
        />
        <p class="mt-4 text-[#3d2314] text-sm">
          Tú y
          <strong class="font-semibold">{{ matchProfile?.username }}</strong> os
          gustáis mutuamente.
        </p>
        <div class="mt-6 flex gap-3">
          <button
            @click="showMatchPopup = false"
            class="flex-1 px-4 py-2.5 rounded-xl border border-[#e3c4b3] text-sm font-medium text-[#6b3f2b] hover:bg-[#fdf5f0] transition-colors"
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
            class="flex-1 px-4 py-2.5 rounded-xl bg-[#c9684a] text-white text-sm font-medium hover:bg-[#b85a3d] transition-colors"
          >
            Ir al chat
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
