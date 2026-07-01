import { ConsciousnessField } from "@/lib/consciousness/types";
import { dominantAxis } from "@/lib/consciousness/resonance-field";
import { createLatticeSealSync } from "@/lib/consciousness/lattice-seal";
import { MemoryImprint, SessionReceipt } from "@/lib/types";
import { clamp } from "@/lib/utils";

interface BuildImprintInput {
  field: ConsciousnessField;
  receipt: SessionReceipt;
  sealPayload: string;
}

export function buildMemoryImprint({ field, receipt, sealPayload }: BuildImprintInput): MemoryImprint {
  const seal = createLatticeSealSync(sealPayload);
  const imprintStrength = clamp(
    Math.round(field.composite * (1 - receipt.silenceRatio * 0.55) * (receipt.protocolBreach ? 0.72 : 1)),
    8,
    100
  );
  const diffusionRate = clamp(
    Math.round(receipt.silenceRatio * 58 + (receipt.protocolBreach ? 24 : 0) + (field.trajectory === "diverging" ? 14 : 0)),
    5,
    100
  );

  return {
    imprintStrength,
    diffusionRate,
    latticeCommitment: seal.commitment,
    resonanceComposite: field.composite,
    dominantAxis: dominantAxis(field.axes),
    trajectory: field.trajectory,
    echoMoments: field.echoMoments,
    noovector: field.noovector,
    prediction: field.prediction
  };
}
