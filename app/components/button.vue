<script setup lang="ts">
defineProps<{
  href: string;
  bgColor?: string;
  textColor?: string;
}>();
</script>

<template>
  <a :href="href" :class="['w-full h-full', bgColor, textColor]">
    <slot />
  </a>
</template>
