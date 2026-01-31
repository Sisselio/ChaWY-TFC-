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
  <div class="h-dvh bg-[#ecd1b2] flex justify-center flex-col pl-32 gap-8">
    <div class="w-3/5">
      <div class="w-fit self-start">
        <p class="text-[#c96444]">CAPITULO UNO</p>
        <hr class="border-[#c96444]" />
      </div>
      <h1 class="text-[6em]">Encuentra un amor de cuento</h1>
      <p>
        Conecta con personas afinesque buscan escribir juntosuna historia
        significativa y duradera.
      </p>
      <p>Tu proximo gran capitulo empieza hoy.</p>
      <CharacterChain />

      <br />
    </div>
  </div>
  <div
    id="funcion"
    class="h-auto bg-[#fdf5ea] flex justify-center items-center p-32 flex-col"
  >
    <p>¿POR QUÉ ELEGIR HEARTMATCH?</p>
    <h1>NOS ENFOCAMOS EN LO QUE REALMENTE IMPORTA</h1>
    <p>
      Sáltate los juegos y encuentra a alguien que comparta tus valores, sueños
      y estilo de vida.
    </p>
    <IconCard />
  </div>
  <div
    id="historias"
    class="h-auto bg-[#efd9bb] flex justify-center items-center p-32 flex-col"
  >
    <h1 class="self-start">HISTORIAS DE ÉXITO</h1>
    <p class="self-start">Personas reales, amor real, finales felices.</p>

    <CharacterCard />
  </div>
</template>
