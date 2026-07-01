import { AppStage } from "@/lib/types";

export function getFlowProgress(stage: AppStage) {
  if (stage === "searching") {
    return { current: 2, total: 2, visible: true };
  }

  if (stage === "frequency") {
    return { current: 1, total: 2, visible: true };
  }

  return { current: 0, total: 2, visible: false };
}
