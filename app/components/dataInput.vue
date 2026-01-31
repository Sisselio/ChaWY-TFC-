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
  if (!props.modelValue) return false;
  return regexText.value.test(props.modelValue);
});
</script>

<template>
  <div class="flex flex-col gap-2 mb-4">
    <label :for="labelFor">
      <slot name="label" />
    </label>

    <div class="w-full">
      <Icon :name="iconName" />

      <input
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        @input="
          emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
        :class="['border', isValid ? 'border-green-500' : 'border-red-500']"
      />

      <p v-if="!isValid" class="mt-1 text-sm text-red-500">
        <slot name="error" />
      </p>
    </div>
  </div>
</template>
