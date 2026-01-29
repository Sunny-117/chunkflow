<template>
  <div :class="className" :style="style || defaultStyles.container" data-testid="upload-progress">
    <!-- Progress bar -->
    <div
      :class="progressBarClassName"
      :style="progressBarClassName ? undefined : defaultStyles.progressBar"
      data-testid="progress-bar"
    >
      <div :class="progressFillClassName" :style="progressFillStyle" data-testid="progress-fill" />
    </div>

    <!-- Progress info -->
    <div
      :class="progressInfoClassName"
      :style="progressInfoClassName ? undefined : defaultStyles.progressInfo"
      data-testid="progress-info"
    >
      <span data-testid="progress-percentage">{{ progress.percentage.toFixed(1) }}%</span>

      <div style="display: flex; gap: 16px">
        <span v-if="showSpeed && progress.speed > 0" data-testid="progress-speed">
          {{ formatFileSize(progress.speed) }}/s
        </span>

        <span
          v-if="showRemainingTime && progress.remainingTime > 0"
          data-testid="progress-remaining-time"
        >
          {{ formatTime(progress.remainingTime) }} remaining
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type CSSProperties } from "vue";
import type { UploadTask } from "@chunkflow/core";
import { formatFileSize } from "@chunkflow/shared";

/**
 * Props for the UploadProgress component
 */
export interface UploadProgressProps {
  /**
   * The upload task to display progress for
   */
  task: UploadTask;

  /**
   * Whether to show upload speed
   * @default true
   */
  showSpeed?: boolean;

  /**
   * Whether to show remaining time
   * @default true
   */
  showRemainingTime?: boolean;

  /**
   * CSS class name for the container
   */
  className?: string;

  /**
   * Custom styles for the container
   */
  style?: CSSProperties;

  /**
   * CSS class name for the progress bar
   */
  progressBarClassName?: string;

  /**
   * CSS class name for the progress fill
   */
  progressFillClassName?: string;

  /**
   * CSS class name for the progress info
   */
  progressInfoClassName?: string;
}

const props = withDefaults(defineProps<UploadProgressProps>(), {
  showSpeed: true,
  showRemainingTime: true,
});

const progress = ref(props.task.getProgress());

const defaultStyles = {
  container: {
    width: "100%",
    padding: "8px",
  } as CSSProperties,
  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "8px",
  } as CSSProperties,
  progressFill: {
    height: "100%",
    backgroundColor: "#4caf50",
    transition: "width 0.3s ease",
    borderRadius: "4px",
  } as CSSProperties,
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#666",
  } as CSSProperties,
};

const progressFillStyle = computed(() => {
  if (props.progressFillClassName) {
    return { width: `${progress.value.percentage}%` };
  }
  return {
    ...defaultStyles.progressFill,
    width: `${progress.value.percentage}%`,
  };
});

const formatTime = (seconds: number): string => {
  if (seconds <= 0 || !isFinite(seconds)) {
    return "0s";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(" ");
};

const handleProgress = () => {
  progress.value = props.task.getProgress();
};

onMounted(() => {
  // Subscribe to progress events
  props.task.on("progress", handleProgress);
  props.task.on("start", handleProgress);
  props.task.on("success", handleProgress);
  props.task.on("error", handleProgress);
  props.task.on("pause", handleProgress);
  props.task.on("resume", handleProgress);

  // Initial update
  handleProgress();
});

onUnmounted(() => {
  // Unsubscribe from events
  props.task.off("progress", handleProgress);
  props.task.off("start", handleProgress);
  props.task.off("success", handleProgress);
  props.task.off("error", handleProgress);
  props.task.off("pause", handleProgress);
  props.task.off("resume", handleProgress);
});
</script>
