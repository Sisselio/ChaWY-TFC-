<script setup lang="ts">
import { ref } from "vue";
const hovered = ref(false);

const characters = [
  { img: "/num.jpg", alt: "Character 1" },
  { img: "/num.jpg", alt: "Character 2" },
  { img: "/num.jpg", alt: "Character 3" },
  { label: "+2k" },
];

const overlap = 0.75;
</script>

<template>
  <div
    class="flex h-12 w-fit cursor-pointer"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div
      v-for="(character, index) in characters"
      :key="index"
      class="border-2 border-[#f8e5c8] overflow-hidden w-12 h-12 rounded-full transition-transform duration-300"
      :class="
        character.label
          ? 'bg-[#c9684a] flex items-center justify-center text-white'
          : 'bg-gray-800'
      "
      :style="{
        transform: hovered
          ? 'translateX(0)'
          : `translateX(-${index * overlap}rem)`,
      }"
    >
      <img
        v-if="character.img"
        :src="character.img"
        :alt="character.alt"
        class="w-full h-full object-cover"
      />
      <span v-else>{{ character.label }}</span>
    </div>
  </div>
</template>
