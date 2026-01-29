<template>
  <div :style="defaultStyles.container" data-testid="upload-item">
    <!-- File info -->
    <div :style="defaultStyles.fileInfo">
      <div :style="{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }">
        <span :style="defaultStyles.fileName" :title="task.file.name">
          {{ task.file.name }}
        </span>
        <span :style="defaultStyles.fileSize">{{ formatFileSize(task.file.size) }}</span>
      </div>
      <span :style="getStatusStyle(status)" data-testid="upload-status">
        {{ getStatusText(status) }}
      </span>
    </div>

    <!-- Progress bar (only show for active uploads) -->
    <UploadProgress
      v-if="
        status === UploadStatus.UPLOADING ||
        status === UploadStatus.PAUSED ||
        status === UploadStatus.HASHING
      "
      :task="task"
    />

    <!-- Actions -->
    <div :style="defaultStyles.actions">
      <button
        v-if="status === UploadStatus.UPLOADING"
        @click="task.pause()"
        :style="defaultStyles.button"
        data-testid="pause-button"
        type="button"
      >
        Pause
      </button>

      <button
        v-if="status === UploadStatus.PAUSED"
        @click="task.resume()"
        :style="defaultStyles.button"
        data-testid="resume-button"
        type="button"
      >
        Resume
      </button>

      <button
        v-if="status === UploadStatus.UPLOADING || status === UploadStatus.PAUSED"
        @click="task.cancel()"
        :style="defaultStyles.button"
        data-testid="cancel-button"
        type="button"
      >
        Cancel
      </button>

      <button
        @click="emit('remove')"
        :style="defaultStyles.button"
        data-testid="remove-button"
        type="button"
      >
        Remove
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, type CSSProperties } from "vue";
import type { UploadTask } from "@chunkflow/core";
import { UploadStatus } from "@chunkflow/protocol";
import { formatFileSize } from "@chunkflow/shared";
import UploadProgress from "./UploadProgress.vue";

/**
 * Props for the DefaultUploadItem component
 */
export interface DefaultUploadItemProps {
  task: UploadTask;
}

const props = defineProps<DefaultUploadItemProps>();

const emit = defineEmits<{
  remove: [];
}>();

const status = ref(props.task.getStatus());

const defaultStyles = {
  container: {
    padding: "16px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    marginBottom: "8px",
    backgroundColor: "#fff",
  } as CSSProperties,
  fileInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  } as CSSProperties,
  fileName: {
    fontWeight: 500,
    fontSize: "14px",
    color: "#333",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    flex: 1,
    marginRight: "8px",
  } as CSSProperties,
  fileSize: {
    fontSize: "12px",
    color: "#999",
  } as CSSProperties,
  status: {
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "4px",
    marginLeft: "8px",
  } as CSSProperties,
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  } as CSSProperties,
  button: {
    padding: "4px 12px",
    fontSize: "12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "all 0.2s",
  } as CSSProperties,
};

const getStatusStyle = (status: UploadStatus): CSSProperties => {
  const baseStyle = defaultStyles.status;
  switch (status) {
    case UploadStatus.UPLOADING:
      return { ...baseStyle, backgroundColor: "#e3f2fd", color: "#1976d2" };
    case UploadStatus.SUCCESS:
      return { ...baseStyle, backgroundColor: "#e8f5e9", color: "#388e3c" };
    case UploadStatus.ERROR:
      return { ...baseStyle, backgroundColor: "#ffebee", color: "#d32f2f" };
    case UploadStatus.PAUSED:
      return { ...baseStyle, backgroundColor: "#fff3e0", color: "#f57c00" };
    case UploadStatus.CANCELLED:
      return { ...baseStyle, backgroundColor: "#f5f5f5", color: "#757575" };
    default:
      return { ...baseStyle, backgroundColor: "#f5f5f5", color: "#757575" };
  }
};

const getStatusText = (status: UploadStatus): string => {
  switch (status) {
    case UploadStatus.IDLE:
      return "Idle";
    case UploadStatus.HASHING:
      return "Hashing";
    case UploadStatus.UPLOADING:
      return "Uploading";
    case UploadStatus.PAUSED:
      return "Paused";
    case UploadStatus.SUCCESS:
      return "Success";
    case UploadStatus.ERROR:
      return "Error";
    case UploadStatus.CANCELLED:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

const handleStatusChange = () => {
  status.value = props.task.getStatus();
};

onMounted(() => {
  // Subscribe to status change events
  props.task.on("start", handleStatusChange);
  props.task.on("success", handleStatusChange);
  props.task.on("error", handleStatusChange);
  props.task.on("pause", handleStatusChange);
  props.task.on("resume", handleStatusChange);
  props.task.on("cancel", handleStatusChange);
});

onUnmounted(() => {
  // Unsubscribe from events
  props.task.off("start", handleStatusChange);
  props.task.off("success", handleStatusChange);
  props.task.off("error", handleStatusChange);
  props.task.off("pause", handleStatusChange);
  props.task.off("resume", handleStatusChange);
  props.task.off("cancel", handleStatusChange);
});
</script>
