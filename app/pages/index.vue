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
      ¿POR QUÉ ELEGIR HEARTMATCH?
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
</template>
