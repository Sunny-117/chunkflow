<template>
  <div
    v-if="displayTasks.length === 0"
    :class="className"
    :style="style || defaultStyles.container"
    data-testid="upload-list-empty"
  >
    <div :style="defaultStyles.empty">{{ emptyMessage }}</div>
  </div>

  <div
    v-else
    :class="className"
    :style="style || defaultStyles.container"
    data-testid="upload-list"
  >
    <div v-for="task in displayTasks" :key="task.id" data-testid="upload-list-item">
      <slot
        :task="task"
        :actions="{
          pause: () => task.pause(),
          resume: () => task.resume(),
          cancel: () => task.cancel(),
          remove: () => removeTask(task.id),
        }"
      >
        <DefaultUploadItem :task="task" @remove="removeTask(task.id)" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from "vue";
import type { UploadTask } from "@chunkflow/core";
import { UploadStatus } from "@chunkflow/protocol";
import { useUploadList } from "@chunkflow/upload-client-vue";
import DefaultUploadItem from "./DefaultUploadItem.vue";

/**
 * Props for the UploadList component
 */
export interface UploadListProps {
  /**
   * CSS class name for the container
   */
  className?: string;

  /**
   * Custom styles for the container
   */
  style?: CSSProperties;

  /**
   * Whether to show completed uploads
   * @default true
   */
  showCompleted?: boolean;

  /**
   * Whether to show failed uploads
   * @default true
   */
  showFailed?: boolean;

  /**
   * Whether to show cancelled uploads
   * @default true
   */
  showCancelled?: boolean;

  /**
   * Maximum number of items to display
   */
  maxItems?: number;

  /**
   * Message to display when there are no uploads
   * @default "No uploads"
   */
  emptyMessage?: string;
}

const props = withDefaults(defineProps<UploadListProps>(), {
  showCompleted: true,
  showFailed: true,
  showCancelled: true,
  emptyMessage: "No uploads",
});

const { tasks, removeTask } = useUploadList();

const defaultStyles = {
  container: {
    width: "100%",
  } as CSSProperties,
  empty: {
    padding: "32px",
    textAlign: "center" as const,
    color: "#999",
    fontSize: "14px",
  } as CSSProperties,
};

const displayTasks = computed(() => {
  // Filter tasks based on props
  const filtered = tasks.value.filter((task: UploadTask) => {
    const status = task.getStatus();

    if (!props.showCompleted && status === UploadStatus.SUCCESS) {
      return false;
    }

    if (!props.showFailed && status === UploadStatus.ERROR) {
      return false;
    }

    if (!props.showCancelled && status === UploadStatus.CANCELLED) {
      return false;
    }

    return true;
  });

  // Limit number of items if maxItems is set
  return props.maxItems ? filtered.slice(0, props.maxItems) : filtered;
});
</script>
