import * as THREE from "three";

export const NEONBOY_AWAKE_SEATED_ID = "neonboy-sentado-despierto-hd";
export const NEONBOY_AWAKE_SEATED_CLIP = "Sentado despierto HD";
export const NEONBOY_TALKING_SEATED_ID = "neonboy-sentado-hablando-hd";
export const NEONBOY_TALKING_SEATED_CLIP = "Sentado hablando HD";

const AWAKE_MOTION = {
  mixamorigSpine: {
    pitch: (phase) => Math.sin(phase * 3) * 0.018
  },
  mixamorigSpine1: {
    pitch: (phase) => Math.sin(phase * 3 - 0.2) * 0.028
  },
  mixamorigSpine2: {
    pitch: (phase) => Math.sin(phase * 3 - 0.45) * 0.028 + Math.sin(phase) * 0.02,
    yaw: (phase) => Math.sin(phase - 0.55) * 0.032
  },
  mixamorigNeck: {
    pitch: (phase) => Math.sin(phase + 0.4) * 0.05
  },
  mixamorigHead: {
    yaw: (phase) => Math.sin(phase - 0.3) * 0.22 + Math.sin(phase * 2 + 0.5) * 0.05,
    pitch: (phase) => Math.sin(phase + 0.8) * 0.06
  },
  mixamorigLeftShoulder: {
    roll: (phase) => Math.sin(phase * 3 - 0.2) * 0.018
  },
  mixamorigRightShoulder: {
    roll: (phase) => -Math.sin(phase * 3 - 0.2) * 0.018
  },
  mixamorigLeftArm: {
    yaw: (phase) => Math.sin(phase * 2 + 0.35) * 0.045
  },
  mixamorigRightArm: {
    yaw: (phase) => -Math.sin(phase * 2 - 0.55) * 0.07,
    roll: (phase) => Math.sin(phase + 0.4) * 0.035
  },
  mixamorigLeftForeArm: {
    yaw: (phase) => Math.sin(phase + 0.5) * 0.055
  },
  mixamorigRightForeArm: {
    yaw: (phase) => -Math.sin(phase - 0.65) * 0.065,
    roll: (phase) => Math.sin(phase * 2 - 0.8) * 0.11
  },
  mixamorigLeftHand: {
    roll: (phase) => Math.sin(phase * 2 + 0.2) * 0.035
  },
  mixamorigRightHand: {
    roll: (phase) => -Math.sin(phase * 2 - 0.45) * 0.04
  }
};

const gesture = (phase, offset) => Math.max(0, Math.sin(phase * 3 + offset)) ** 2;
const TALKING_MOTION = {
  mixamorigSpine: {
    pitch: (phase) => Math.sin(phase * 3 - 0.2) * 0.025
  },
  mixamorigSpine1: {
    pitch: (phase) => Math.sin(phase * 3 - 0.45) * 0.04,
    yaw: (phase) => Math.sin(phase * 2) * 0.045
  },
  mixamorigSpine2: {
    pitch: (phase) => Math.sin(phase * 3 - 0.7) * 0.04,
    yaw: (phase) => Math.sin(phase * 2 - 0.25) * 0.055
  },
  mixamorigNeck: {
    pitch: (phase) => Math.sin(phase * 3 + 0.4) * 0.045
  },
  mixamorigHead: {
    pitch: (phase) => Math.sin(phase * 3 + 0.7) * 0.075,
    yaw: (phase) => Math.sin(phase * 2 - 0.3) * 0.12
  },
  mixamorigLeftArm: {
    pitch: (phase) => -0.3 - gesture(phase, 0.2) * 0.55,
    roll: (phase) => Math.sin(phase * 3 + 0.2) * 0.085
  },
  mixamorigRightArm: {
    pitch: (phase) => -0.3 - gesture(phase, -1.45) * 0.55,
    roll: (phase) => -Math.sin(phase * 3 - 1.45) * 0.085
  },
  mixamorigLeftForeArm: {
    pitch: (phase) => -0.28 - gesture(phase, 0.45) * 0.6,
    yaw: (phase) => Math.sin(phase * 3 + 0.2) * 0.17
  },
  mixamorigRightForeArm: {
    pitch: (phase) => -0.28 - gesture(phase, -1.2) * 0.6,
    yaw: (phase) => -Math.sin(phase * 3 - 1.45) * 0.17
  },
  mixamorigLeftHand: {
    roll: (phase) => Math.sin(phase * 3 + 0.4) * 0.12
  },
  mixamorigRightHand: {
    roll: (phase) => -Math.sin(phase * 3 - 1.25) * 0.12
  }
};

const ease = (start, end, value) => {
  const t = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};
const accent = (phase) => Math.sin(phase / 2) ** 2;
const applause = (phase) => {
  const progress = phase / (Math.PI * 2);
  return ease(0.12, 0.26, progress) * (1 - ease(0.65, 0.78, progress));
};
const clap = (phase) => applause(phase) * Math.sin(phase * 3) ** 2;

const QUIET_DIALOGUE_MOTION = {
  mixamorigSpine: { pitch: (phase) => Math.sin(phase * 2) * 0.012 },
  mixamorigSpine2: { pitch: (phase) => Math.sin(phase * 2 - 0.4) * 0.018 },
  mixamorigHead: {
    pitch: (phase) => Math.sin(phase * 2 + 0.3) * 0.025,
    yaw: (phase) => Math.sin(phase - 0.2) * 0.05
  }
};

const TALKING_VARIANTS = [
  { name: NEONBOY_TALKING_SEATED_CLIP, motion: TALKING_MOTION },
  { name: "Dialogo tranquilo", motion: QUIET_DIALOGUE_MOTION },
  { name: "Un brazo", motion: {
    ...QUIET_DIALOGUE_MOTION,
    mixamorigRightArm: {
      pitch: (phase) => -0.12 - gesture(phase, -0.8) * 0.38,
      roll: (phase) => -Math.sin(phase * 3 - 0.8) * 0.09
    },
    mixamorigRightForeArm: {
      pitch: (phase) => -0.12 - gesture(phase, -0.5) * 0.42,
      yaw: (phase) => -Math.sin(phase * 3 - 0.8) * 0.14
    },
    mixamorigRightHand: { roll: (phase) => -Math.sin(phase * 3 - 0.4) * 0.08 }
  } },
  { name: "Enfasis puntual", motion: {
    ...QUIET_DIALOGUE_MOTION,
    mixamorigSpine2: { pitch: (phase) => -accent(phase) * 0.08 },
    mixamorigHead: { pitch: (phase) => -accent(phase) * 0.08 },
    mixamorigRightArm: { pitch: (phase) => -accent(phase) * 0.64, roll: (phase) => -accent(phase) * 0.16 },
    mixamorigRightForeArm: { pitch: (phase) => -accent(phase) * 0.55 },
    mixamorigRightHand: { roll: (phase) => -accent(phase) * 0.13 }
  } },
  { name: "Asintiendo", motion: {
    ...QUIET_DIALOGUE_MOTION,
    mixamorigHead: {
      pitch: (phase) => Math.sin(phase * 3) * 0.13 + Math.sin(phase) * 0.025,
      yaw: (phase) => Math.sin(phase - 0.4) * 0.035
    },
    mixamorigNeck: { pitch: (phase) => Math.sin(phase * 3 - 0.2) * 0.045 }
  } },
  { name: "Aplauso y pausa", motion: {
    ...QUIET_DIALOGUE_MOTION,
    mixamorigSpine2: { pitch: (phase) => -applause(phase) * 0.045 },
    mixamorigLeftArm: {
      pitch: (phase) => -applause(phase) * 0.28,
      roll: (phase) => -applause(phase) * 0.36 - clap(phase) * 0.5
    },
    mixamorigRightArm: {
      pitch: (phase) => -applause(phase) * 0.28,
      roll: (phase) => applause(phase) * 0.36 + clap(phase) * 0.5
    },
    mixamorigLeftForeArm: {
      pitch: (phase) => -applause(phase) * 0.28,
      roll: (phase) => -applause(phase) * 0.26 - clap(phase) * 0.38
    },
    mixamorigRightForeArm: {
      pitch: (phase) => -applause(phase) * 0.28,
      roll: (phase) => applause(phase) * 0.26 + clap(phase) * 0.38
    },
    mixamorigLeftHand: { roll: (phase) => -clap(phase) * 0.12 },
    mixamorigRightHand: { roll: (phase) => clap(phase) * 0.12 }
  } },
  { name: "Duda", motion: {
    ...QUIET_DIALOGUE_MOTION,
    mixamorigHead: { roll: (phase) => Math.sin(phase / 2) ** 2 * 0.15, yaw: (phase) => Math.sin(phase) * 0.065 },
    mixamorigLeftShoulder: { roll: (phase) => -accent(phase) * 0.13 },
    mixamorigRightShoulder: { roll: (phase) => accent(phase) * 0.13 },
    mixamorigLeftArm: { roll: (phase) => accent(phase) * 0.18 },
    mixamorigRightArm: { roll: (phase) => -accent(phase) * 0.18 }
  } },
  { name: "Risa suave", motion: {
    ...QUIET_DIALOGUE_MOTION,
    mixamorigSpine1: { pitch: (phase) => Math.sin(phase * 4) ** 2 * 0.045 },
    mixamorigSpine2: { pitch: (phase) => Math.sin(phase * 4 - 0.25) ** 2 * 0.04 },
    mixamorigHead: { pitch: (phase) => -0.06 - Math.sin(phase * 4 + 0.4) ** 2 * 0.06 },
    mixamorigLeftShoulder: { roll: (phase) => Math.sin(phase * 4) * 0.035 },
    mixamorigRightShoulder: { roll: (phase) => -Math.sin(phase * 4) * 0.035 }
  } }
];

export const NEONBOY_TALKING_SEATED_CLIP_NAMES = Object.freeze(TALKING_VARIANTS.map((variant) => variant.name));

const TALKING_BACK_WIDTH = [
  ["mixamorigSpine1", 1.08],
  ["mixamorigSpine2", 1.12],
  ["mixamorigNeck", 1 / (1.08 * 1.12)]
];

const AXES = {
  pitch: new THREE.Vector3(1, 0, 0),
  yaw: new THREE.Vector3(0, 1, 0),
  roll: new THREE.Vector3(0, 0, 1)
};

export function createSeatedAnimationClips(model, sourceClips) {
  const presetId = model?.userData?.bundledModel;
  const name = presetId === NEONBOY_AWAKE_SEATED_ID ? NEONBOY_AWAKE_SEATED_CLIP
    : presetId === NEONBOY_TALKING_SEATED_ID ? NEONBOY_TALKING_SEATED_CLIP : null;
  if (!name || sourceClips.some((clip) => clip.name === name)) return sourceClips;
  const source = sourceClips.find((clip) => clip.duration >= 0.25);
  if (!source) return [];

  model.updateWorldMatrix(true, true);
  const modelRotation = model.getWorldQuaternion(new THREE.Quaternion());
  const variants = presetId === NEONBOY_AWAKE_SEATED_ID
    ? [{ name, motion: AWAKE_MOTION }] : TALKING_VARIANTS;
  return variants.map((variant) => {
    const clip = source.clone();
    clip.name = variant.name;
    clip.tracks.forEach((track) => {
      if (!track.name.endsWith(".quaternion")) return;
      const bone = model.getObjectByName(track.name.slice(0, -".quaternion".length));
      const motions = variant.motion[bone?.name];
      if (!bone?.isBone || !motions) return;
      const parentRotation = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
      const axes = Object.fromEntries(Object.keys(motions).map((axis) => [
        axis, AXES[axis].clone().applyQuaternion(modelRotation).applyQuaternion(parentRotation).normalize()
      ]));
      const start = track.times[0];
      const duration = track.times[track.times.length - 1] - start || clip.duration;
      for (let index = 0; index < track.times.length; index += 1) {
        const phase = (track.times[index] - start) / duration * Math.PI * 2;
        const pose = new THREE.Quaternion().fromArray(track.values, index * 4);
        Object.entries(motions).forEach(([axis, angleAt]) => {
          pose.premultiply(new THREE.Quaternion().setFromAxisAngle(axes[axis], angleAt(phase)));
        });
        pose.normalize().toArray(track.values, index * 4);
      }
    });
    if (presetId === NEONBOY_TALKING_SEATED_ID) {
      for (const [boneName, width] of TALKING_BACK_WIDTH) {
        if (!model.getObjectByName(boneName)?.isBone) continue;
        clip.tracks.push(new THREE.VectorKeyframeTrack(`${boneName}.scale`, [0, clip.duration], [width, 1, 1, width, 1, 1]));
      }
    }
    return clip;
  });
}
