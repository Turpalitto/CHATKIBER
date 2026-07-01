import { ConsciousnessAxes, ConsciousnessTrajectory } from "@/lib/consciousness/types";
import { Message } from "@/lib/types";
import { clamp } from "@/lib/utils";

export function computeNoovector(
  axes: ConsciousnessAxes,
  trajectory: ConsciousnessTrajectory,
  messages: Message[]
): { noovector: [number, number, number]; prediction: string } {
  const intimacy = clamp((axes.luminance * 0.55 + axes.depth * 0.45) / 100, 0, 1);
  const tension = clamp((axes.entropy * 0.35 + (100 - axes.coherence) * 0.65) / 100, 0, 1);
  const drift = clamp((axes.entropy * 0.5 + (trajectory === "diverging" ? 42 : trajectory === "ascending" ? 12 : 24)) / 100, 0, 1);

  const noovector: [number, number, number] = [
    Math.round(intimacy * 100),
    Math.round(tension * 100),
    Math.round(drift * 100)
  ];

  const prediction = predictArc(intimacy, tension, drift, messages.length, trajectory);
  return { noovector, prediction };
}

function predictArc(
  intimacy: number,
  tension: number,
  drift: number,
  messageCount: number,
  trajectory: ConsciousnessTrajectory
) {
  if (messageCount < 3) {
    return "noosphere.calibrating";
  }

  if (trajectory === "diverging" && tension > 0.62) {
    return "noosphere.fork";
  }
  if (intimacy > 0.72 && drift < 0.35) {
    return "noosphere.deepen";
  }
  if (tension > 0.68 && intimacy > 0.45) {
    return "noosphere.catalyst";
  }
  if (drift > 0.7) {
    return "noosphere.drift";
  }
  if (trajectory === "ascending") {
    return "noosphere.ascend";
  }
  return "noosphere.stable";
}
