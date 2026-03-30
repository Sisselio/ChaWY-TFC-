<script setup>
import { ref, computed, onMounted } from "vue";

const supabase = useSupabaseClient();

const tables = ref([]);
const selectedTable = ref(null);
const tableData = ref([]);
const columns = ref([]);
const search = ref("");

const editingRow = ref(null);
const editingData = ref({});
const deletingRow = ref(null);
const saving = ref(false);
const deleting = ref(false);

const inserting = ref(false);
const insertData = ref({});
const insertSaving = ref(false);

const showAdvancedFilter = ref(false);
const advancedFilters = ref({});

const READONLY_FIELDS = ["id"];

const isReadonly = (col) => {
  if (READONLY_FIELDS.includes(col)) return true;
  if (/image|imagen|img|photo|foto|picture|avatar|thumbnail/i.test(col))
    return true;
  return false;
};

const isReadonlyWithValue = (col, value) => {
  if (isReadonly(col)) return true;
  if (
    typeof value === "string" &&
    /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(value)
  )
    return true;
  return false;
};

const filteredData = computed(() => {
  if (!tableData.value || tableData.value.length === 0) return [];

  let result = tableData.value;

  if (search.value) {
    const term = search.value.toString().toLowerCase().trim();
    result = result.filter((row) =>
      columns.value.some((col) => {
        const value = row[col];
        return (
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(term)
        );
      }),
    );
  }

  const activeFilters = Object.entries(advancedFilters.value).filter(
    ([_, v]) => v !== "" && v !== null && v !== undefined,
  );
  if (activeFilters.length > 0) {
    result = result.filter((row) =>
      activeFilters.every(([col, val]) => {
        const rowVal = row[col];
        return (
          rowVal !== null &&
          rowVal !== undefined &&
          String(rowVal).toLowerCase().includes(String(val).toLowerCase())
        );
      }),
    );
  }

  return result;
});

const activeFilterCount = computed(
  () =>
    Object.values(advancedFilters.value).filter(
      (v) => v !== "" && v !== null && v !== undefined,
    ).length,
);

const loadTables = async () => {
  const { data } = await supabase.rpc("get_tables");
  tables.value = data.map((t) => t.table_name);
};

const loadTableData = async (tableName) => {
  selectedTable.value = tableName;
  search.value = "";
  editingRow.value = null;
  deletingRow.value = null;
  inserting.value = false;
  insertData.value = {};
  showAdvancedFilter.value = false;
  advancedFilters.value = {};

  const { data } = await supabase.from(tableName).select("*");
  if (data && data.length > 0) {
    tableData.value = data;
    columns.value = Object.keys(data[0]);
  } else {
    tableData.value = [];
    columns.value = [];
  }
};

const toggleAdvancedFilter = () => {
  showAdvancedFilter.value = !showAdvancedFilter.value;
  if (showAdvancedFilter.value) {
    advancedFilters.value = columns.value.reduce((acc, col) => {
      acc[col] = advancedFilters.value[col] ?? "";
      return acc;
    }, {});
    inserting.value = false;
  }
};

const clearAdvancedFilters = () => {
  advancedFilters.value = columns.value.reduce((acc, col) => {
    acc[col] = "";
    return acc;
  }, {});
};

const highlight = (value) => {
  if (!search.value || value === null || value === undefined)
    return String(value ?? "");
  const term = search.value.toString().trim();
  if (!term) return String(value);
  const regex = new RegExp(
    `(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return String(value).replace(
    regex,
    '<mark class="bg-[#ecd1b2] rounded px-0.5">$1</mark>',
  );
};

const startEdit = (row, index) => {
  editingRow.value = index;
  editingData.value = { ...row };
  deletingRow.value = null;
  inserting.value = false;
};

const cancelEdit = () => {
  editingRow.value = null;
  editingData.value = {};
};

const saveEdit = async (row, index) => {
  saving.value = true;
  try {
    const pkField = columns.value.includes("id") ? "id" : columns.value[0];
    const pkValue = row[pkField];
    const { error } = await supabase
      .from(selectedTable.value)
      .update(editingData.value)
      .eq(pkField, pkValue);
    if (!error) {
      const realIndex = tableData.value.indexOf(row);
      tableData.value[realIndex] = { ...editingData.value };
      cancelEdit();
    } else {
      console.error("Error al guardar:", error.message);
    }
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (index) => {
  deletingRow.value = index;
  editingRow.value = null;
  inserting.value = false;
};

const cancelDelete = () => {
  deletingRow.value = null;
};

const deleteRow = async (row) => {
  deleting.value = true;
  try {
    const pkField = columns.value.includes("id") ? "id" : columns.value[0];
    const pkValue = row[pkField];
    const { error } = await supabase
      .from(selectedTable.value)
      .delete()
      .eq(pkField, pkValue);
    if (!error) {
      tableData.value = tableData.value.filter((r) => r !== row);
      deletingRow.value = null;
    } else {
      console.error("Error al eliminar:", error.message);
    }
  } finally {
    deleting.value = false;
  }
};

const startInsert = () => {
  inserting.value = true;
  editingRow.value = null;
  deletingRow.value = null;
  showAdvancedFilter.value = false;
  insertData.value = columns.value.reduce((acc, col) => {
    if (!READONLY_FIELDS.includes(col)) acc[col] = "";
    return acc;
  }, {});
};

const cancelInsert = () => {
  inserting.value = false;
  insertData.value = {};
};

const saveInsert = async () => {
  insertSaving.value = true;
  try {
    const { data, error } = await supabase
      .from(selectedTable.value)
      .insert([insertData.value])
      .select();
    if (!error && data && data.length > 0) {
      tableData.value.push(data[0]);
      cancelInsert();
    } else {
      console.error("Error al insertar:", error?.message);
    }
  } finally {
    insertSaving.value = false;
  }
};

onMounted(() => {
  loadTables();
});
</script>

<template>
  <div class="p-6 max-w-full overflow-x-hidden">
    <h1 class="text-3xl font-bold mb-6">Panel de Administración</h1>

    <div class="flex flex-wrap gap-3 mb-8">
      <button
        v-for="table in tables"
        :key="table"
        @click="loadTableData(table)"
        class="bg-[#c9684a] text-white px-4 py-2 rounded hover:bg-[#b25738]"
      >
        {{ table }}
      </button>
    </div>

    <div v-if="selectedTable">
      <div class="mb-2 flex gap-3 items-center flex-wrap">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar en cualquier campo..."
          class="border p-3 rounded w-full max-w-md"
        />
        <button
          @click="toggleAdvancedFilter"
          class="underline text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
        >
          Búsqueda avanzada
        </button>
        <button
          @click="startInsert"
          class="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition-colors ml-auto"
        >
          <span class="text-lg leading-none">+</span> Insertar registro
        </button>
      </div>

      <div
        v-if="showAdvancedFilter"
        class="border border-gray-200 rounded-lg bg-gray-50 p-5 mb-6 mt-3"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-700 text-sm">
            Búsqueda avanzada —
            <span class="text-gray-400 font-normal"
              >Rellena solo los campos por los que quieras filtrar</span
            >
          </h2>
          <button
            v-if="activeFilterCount > 0"
            @click="clearAdvancedFilters"
            class="text-xs text-red-400 hover:text-red-600 underline"
          >
            Limpiar filtros
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div v-for="col in columns" :key="col" class="flex flex-col gap-1">
            <label
              class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >{{ col }}</label
            >
            <input
              v-model="advancedFilters[col]"
              :placeholder="`Filtrar por ${col}…`"
              class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9684a] focus:border-transparent"
              :class="{ 'bg-[#fff8f5] border-[#c9684a]': advancedFilters[col] }"
            />
          </div>
        </div>

        <p class="text-xs text-gray-400 mt-4">
          Mostrando
          <span class="font-semibold text-gray-600">{{
            filteredData.length
          }}</span>
          resultado{{ filteredData.length !== 1 ? "s" : "" }} de
          {{ tableData.length }} registros
        </p>
      </div>

      <div
        v-if="inserting"
        class="border-2 border-green-400 rounded-lg shadow-sm p-5 bg-white mb-8 max-w-xl"
      >
        <h2 class="font-bold text-gray-700 mb-4">
          Nuevo registro en
          <span class="text-[#c9684a]">{{ selectedTable }}</span>
        </h2>
        <div
          v-for="col in columns.filter((c) => !READONLY_FIELDS.includes(c))"
          :key="col"
          class="flex flex-col border-b py-2 text-sm"
        >
          <label class="font-semibold text-gray-600 mb-1">{{ col }}</label>
          <input
            v-model="insertData[col]"
            :placeholder="col"
            class="border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div class="mt-4 flex gap-2 justify-end">
          <button
            @click="cancelInsert"
            class="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            @click="saveInsert"
            :disabled="insertSaving"
            class="text-sm px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {{ insertSaving ? "Guardando…" : "Guardar" }}
          </button>
        </div>
      </div>

      <div
        class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 min-w-0"
      >
        <div
          v-for="(row, index) in filteredData"
          :key="index"
          class="border rounded-lg shadow-sm p-4 bg-white min-w-0 flex flex-col"
          :class="{
            'ring-2 ring-[#c9684a]': editingRow === index,
            'ring-2 ring-red-400': deletingRow === index,
          }"
        >
          <div
            v-for="col in columns"
            :key="col"
            class="flex flex-col sm:flex-row sm:justify-between border-b py-2 text-sm min-w-0"
          >
            <span class="font-semibold text-gray-600 shrink-0">
              {{ col }}
            </span>

            <template v-if="editingRow === index">
              <span
                v-if="isReadonlyWithValue(col, row[col])"
                class="text-gray-400 sm:text-right italic text-xs self-center break-all min-w-0"
              >
                {{ row[col] ?? "—" }}
              </span>
              <input
                v-else
                v-model="editingData[col]"
                class="text-gray-800 sm:text-right border border-gray-300 rounded px-2 py-0.5 text-sm min-w-0 w-full sm:w-auto sm:max-w-[60%]"
              />
            </template>

            <span
              v-else
              class="text-gray-800 sm:text-right break-all min-w-0"
              v-html="highlight(row[col])"
            />
          </div>

          <div class="mt-4 pt-3 border-t flex gap-2 justify-end">
            <template v-if="deletingRow === index">
              <span class="text-sm text-red-500 mr-auto self-center"
                >¿Eliminar?</span
              >
              <button
                @click="cancelDelete"
                class="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                @click="deleteRow(row)"
                :disabled="deleting"
                class="text-sm px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {{ deleting ? "Eliminando…" : "Confirmar" }}
              </button>
            </template>

            <template v-else-if="editingRow === index">
              <button
                @click="cancelEdit"
                class="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                @click="saveEdit(row, index)"
                :disabled="saving"
                class="text-sm px-3 py-1.5 rounded bg-[#c9684a] text-white hover:bg-[#b25738] disabled:opacity-50"
              >
                {{ saving ? "Guardando…" : "Guardar" }}
              </button>
            </template>

            <template v-else>
              <button
                @click="startEdit(row, index)"
                class="text-sm px-3 py-1.5 rounded border border-[#c9684a] text-[#c9684a] hover:bg-[#c9684a] hover:text-white transition-colors"
              >
                Editar
              </button>
              <button
                @click="confirmDelete(index)"
                class="text-sm px-3 py-1.5 rounded border border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                Eliminar
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
