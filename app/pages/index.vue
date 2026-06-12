<script setup>
onMounted(() => {
  const sessionEmail = localStorage.getItem("session_email");
  if (sessionEmail) {
    return navigateTo("/home");
  } else {
    return navigateTo("/");
  }
});
</script>

<template>
  <Navbar
    :showLogo="true"
    :showLandingLinks="true"
    :showRegisterLinks="true"
    :showSesionLinks="true"
  />

  <section
    class="min-h-screen bg-[#ecd1b2] flex items-center px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-16 md:py-24"
  >
    <div class="max-w-5xl space-y-6 md:space-y-8">
      <div class="w-fit">
        <p
          class="text-[#c96444] tracking-widest text-xs sm:text-sm font-semibold"
        >
          CAPÍTULO UNO
        </p>
        <div class="h-[2px] bg-[#c96444] mt-1 w-20 sm:w-24"></div>
      </div>

      <h1
        class="font-serif font-bold text-[#6b3f2b] leading-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
      >
        Encuentra <br />
        un amor de
        <span class="text-[#c96444] italic">cuento</span>
      </h1>

      <p
        class="text-[#6b3f2b]/80 leading-relaxed text-base sm:text-lg md:text-xl max-w-xl"
      >
        Conecta con personas afines que buscan escribir juntos una historia
        significativa y duradera. Tu próximo gran capítulo empieza hoy.
      </p>

      <CharacterChain />
    </div>
  </section>

  <section
    id="funcion"
    class="bg-[#fdf5ea] py-20 sm:py-24 md:py-32 px-6 sm:px-10 md:px-16 lg:px-24 text-center flex flex-col items-center"
  >
    <p class="text-xs sm:text-sm tracking-widest text-[#c96444] font-semibold">
      ¿POR QUÉ ELEGIR CHAWY?
    </p>

    <h1
      class="font-serif font-bold text-[#6b3f2b] mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl"
    >
      Nos enfocamos en lo que
      <span class="text-[#c96444] italic">realmente importa</span>
    </h1>

    <p class="text-[#6b3f2b]/70 mt-6 text-sm sm:text-base md:text-lg max-w-2xl">
      Sáltate los juegos y encuentra a alguien que comparta tus valores, sueños
      y estilo de vida.
    </p>

    <div class="mt-12 md:mt-16 w-full">
      <IconCard />
    </div>
  </section>

  <section
    id="historias"
    class="bg-[#efd9bb] py-20 sm:py-24 md:py-32 px-6 sm:px-10 md:px-16 lg:px-24 flex flex-col gap-10 md:gap-14"
  >
    <div class="space-y-2">
      <h1
        class="font-serif font-bold text-[#6b3f2b] text-2xl sm:text-3xl md:text-4xl"
      >
        Historias de éxito
      </h1>

      <p class="text-[#6b3f2b]/70 text-sm sm:text-base">
        Personas reales, amor real, finales felices.
      </p>
    </div>

    <CharacterCard />
  </section>
  <footer
    class="bg-[#6b3f2b] text-[#fdf5ea] py-12 px-6 sm:px-10 md:px-16 lg:px-24"
  >
    <div
      class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10"
    >
      <div class="max-w-sm">
        <h3 class="font-serif text-3xl font-bold">Chawy</h3>

        <p class="mt-4 text-[#fdf5ea]/80 text-sm leading-relaxed">
          Conecta con personas que comparten tus valores y construye una
          historia auténtica y duradera.
        </p>
      </div>

      <div>
        <h4 class="font-semibold text-lg mb-4">Legal</h4>

        <ul class="space-y-2 text-sm text-[#fdf5ea]/80">
          <li>
            <a href="#" class="hover:text-white transition"
              >Política de Privacidad</a
            >
          </li>
          <li>
            <a href="#" class="hover:text-white transition"
              >Términos y Condiciones</a
            >
          </li>
          <li>
            <a href="#" class="hover:text-white transition"
              >Política de Cookies</a
            >
          </li>
          <li>
            <a href="#" class="hover:text-white transition">Aviso Legal</a>
          </li>
        </ul>
      </div>

      <div>
        <h4 class="font-semibold text-lg mb-4">Contacto</h4>

        <ul class="space-y-2 text-sm text-[#fdf5ea]/80">
          <li>contacto@chawy.com</li>
          <li>Madrid, España</li>
        </ul>
      </div>

      <div>
        <h4 class="font-semibold text-lg mb-4">Síguenos</h4>

        <div class="flex gap-4 text-sm">
          <a href="#" class="hover:text-white transition"> Instagram </a>
          <a href="#" class="hover:text-white transition"> TikTok </a>
          <a href="#" class="hover:text-white transition"> X </a>
        </div>
      </div>
    </div>

    <div
      class="border-t border-[#fdf5ea]/20 mt-10 pt-6 text-center text-sm text-[#fdf5ea]/60"
    >
      © {{ new Date().getFullYear() }} Chawy. Todos los derechos reservados.
    </div>
  </footer>
</template>
