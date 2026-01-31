<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  labelFor?: string;
  modelValue?: string;
  placeholder?: string;
  type: string;
  iconName: string;
  regex: RegExp | string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const regexText = computed<RegExp | null>(() => {
  if (!props.regex) return null;
  return typeof props.regex === "string"
    ? new RegExp(props.regex)
    : props.regex;
});

const isValid = computed<boolean>(() => {
  if (!regexText.value) return true;
  if (!props.modelValue) return true;
  return regexText.value.test(props.modelValue);
});
</script>

<template>
  <div class="flex flex-col gap-2 mb-4">
    <label :for="labelFor" class="font-medium text-gray-700 font-serif">
      <slot name="label" />
    </label>

    <div
      class="flex items-center gap-2 rounded-full p-2"
      :class="[isValid ? 'border-green-500' : 'border-red-500', 'border']"
      style="background: linear-gradient(to right, #faedcd, #d09a63)"
    >
      <Icon :name="iconName" class="w-5 h-5 text-gray-400 flex-shrink-0" />

      <input
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        @input="
          emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
        class="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400"
      />
    </div>

    <p v-if="!isValid" class="mt-1 text-sm text-red-500">
      <slot name="error" />
    </p>
  </div>
</template>
