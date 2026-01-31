<script setup>
import { onMounted } from "vue";

const props = defineProps({
  message: String,
  duration: Number,
});

const emit = defineEmits(["close"]);

onMounted(() => {
  setTimeout(() => {
    emit("close");
  }, props.duration);
});
</script>

<template>
  <div class="flex justify-center items-start"></div>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 -translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-300"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-3"
  >
    <div
      class="fixed top-16 right-5 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg font-medium"
    >
      {{ message }}
    </div>
  </transition>
</template>
