#!/usr/bin/env python3
"""Generate deterministic, original Halloween effects as 44.1 kHz PCM WAV."""
import argparse
import math
import random
import struct
import wave
from pathlib import Path

RATE = 44100
TAU = 2 * math.pi
OUT = Path(__file__).resolve().parents[1] / "audio" / "sfx"

def envelope(t, duration, attack=0.008, release=0.09):
    return min(1.0, t / attack if attack else 1.0, (duration - t) / release if release else 1.0)

def pulse(t, at, decay):
    return math.exp(-max(0.0, t - at) / decay) if t >= at else 0.0

def synth(name, duration, index):
    rng = random.Random(90431 + index * 101)
    samples = []
    lowpass = 0.0
    held = 0.0
    for i in range(round(duration * RATE)):
        t = i / RATE
        n = rng.uniform(-1.0, 1.0)
        lowpass = lowpass * .92 + n * .08
        if i % 120 == 0:
            held = n
        out = 0.0
        if name in ("chest-open", "chest-close"):
            # Dry timber resonance, a latch click, and the irregular friction of a hinge.
            closing = name == "chest-close"
            contact = .58 if closing else .035
            u = max(0, t-contact)
            knock = (.34*math.sin(TAU*118*u) + .21*math.sin(TAU*237*u) + .10*n) * pulse(t,contact,.045)
            friction = math.sin(math.pi * min(1,max(0,(t-.12)/.55))) ** 2
            phase = TAU*(164*t + 35*t*t + 1.6*math.sin(t*13))
            creak = (.13*math.sin(phase) + .06*math.sin(phase*2.02) + .04*lowpass) * friction * (.6+.4*math.sin(t*51)**2)
            latch = (.12*n + .15*math.sin(TAU*1920*t)) * pulse(t,.65 if closing else .09,.015)
            out = knock + creak + latch
        elif name == "chest-locked":
            out = sum((.2*math.sin(TAU*850*(t-a)) + .12*n + .13*math.sin(TAU*147*(t-a))) * pulse(t,a,.025) for a in (.03,.13,.25))
        elif name == "reality-key":
            # Short metallic jingle, with inharmonic overtones rather than a musical cue.
            out = sum(sum(.16*math.sin(TAU*f*(t-a))*pulse(t,a,.08) for f in (1640,2317,3601)) for a in (.025,.17,.29,.43))
        elif name == "telefono-ring":
            gate = sum(1.0 for a in (0.06, .72, 1.38) if a <= t < a + .42)
            out = gate * (.44 * math.sin(TAU * 440 * t) + .3 * math.sin(TAU * 480 * t)) * (0.75 + .25 * math.sin(TAU * 22 * t))
        elif name in ("telefono-pickup", "telefono-hangup", "vhs-pickup"):
            hits = (0.04, .16) if name == "telefono-pickup" else (0.05, .19) if name == "telefono-hangup" else (.04, .13)
            out = sum((.36 * n + .4 * math.sin(TAU * (180 if name.startswith("telefono") else 230) * (t-a))) * pulse(t,a,.025) for a in hits)
        elif name in ("telefono-static", "vhs-static"):
            crackle = 1.0 if rng.random() < .004 else 0.0
            out = .19 * n + .28 * lowpass + crackle * .22 * n
            if name == "telefono-static":
                out *= .6 + .4 * math.sin(TAU * 2.3 * t) ** 2
        elif name in ("matrix-activate", "matrix-deactivate"):
            f0, f1 = (180, 1300) if name == "matrix-activate" else (1250, 140)
            phase = TAU * (f0 * t + (f1 - f0) * t*t / (2*duration))
            out = .38 * math.sin(phase) + .12 * math.sin(phase * 2.01) + .13 * held
        elif name == "matrix-glitch":
            out = (.36 * held + .18 * n) * (1 if int(t * 26) % 5 else .1)
        elif name == "matrix-secret":
            out = sum(.28 * math.sin(TAU * f * (t-a)) * pulse(t,a,.22) for f,a in ((784,.02),(1175,.15),(1568,.29)))
        elif name == "mirror-whisper":
            out = (.35 * lowpass + .15 * math.sin(TAU * 74 * t)) * (.45 + .55 * math.sin(TAU * 1.6 * t) ** 2)
        elif name == "mirror-reveal":
            out = .32 * math.sin(TAU * (65 * t + 140*t*t/duration)) * min(1,t/.65) + .19 * math.sin(TAU * 930 * t) * pulse(t,duration*.76,.13)
        elif name == "vhs-insert":
            out = .14 * math.sin(TAU * 96 * t) * min(1,t/.25)
            out += sum((.32 * n + .16 * math.sin(TAU*320*t)) * pulse(t,a,.04) for a in (.1,.36,.87,1.1))
        elif name == "vhs-play":
            out = .3 * n * pulse(t,.08,.035) + .2 * math.sin(TAU * (90 + 150*t) * t) * pulse(t,.21,.34)
        elif name == "electric-flicker":
            out = sum((.3 * n + .2 * held) * pulse(t,a,.018) for a in (.12,.19,.51,.93,1.02,1.41))
        elif name == "demon-hit":
            out = .46 * math.sin(TAU * (110*t - 60*t*t)) * math.exp(-t*4) + .18*held*math.exp(-t*5)
        elif name == "demon-code-hit":
            # Bass contact, torn data bursts, then a short descending digital tail.
            out = .42 * math.sin(TAU * (190*t - 110*t*t)) * math.exp(-t*8)
            out += (.24*held + .1*n) * math.exp(-t*5) * (1 if int(t*45)%3 else .18)
            out += sum(.13*math.sin(TAU*f*(t-a))*pulse(t,a,.045) for f,a in ((1600,.03),(1050,.13),(680,.25),(330,.4)))
        elif name == "demon-shield":
            # Original resonant energy contact, glass harmonics and a soft tail.
            out = .35 * math.sin(TAU * (160*t + 90*t*t)) * math.exp(-t*9)
            out += .25 * math.sin(TAU * (820*t - 240*t*t)) * math.exp(-t*5)
            out += .14 * math.sin(TAU * 1870*t) * math.exp(-t*7)
            out += .12 * n * math.exp(-t*28)
        elif name == "demon-taunt":
            # Original voiced, throaty chuckle; four falling "ha" syllables.
            for a, f in ((.03,175),(.31,164),(.59,149),(.9,130)):
                u = t-a
                if 0 <= u < .25:
                    breath = math.sin(math.pi*u/.25)**1.7
                    phase = TAU*(f*u - 34*u*u)
                    voiced = sum(math.sin(h*phase) * (math.exp(-((h*f-640)/240)**2) + .55*math.exp(-((h*f-1150)/320)**2) + .18*math.exp(-((h*f-2350)/430)**2)) / h for h in range(1,23))
                    out += breath * (.95*voiced + .1*lowpass)
        elif name == "demon-death":
            out = .36 * math.sin(TAU * (260*t - 40*t*t)) * math.exp(-t*.8) + .19*lowpass*math.exp(-t*.7)
        elif name == "heart-lost":
            out = .5 * math.sin(TAU * (120*t - 80*t*t)) * math.exp(-t*6) + .12*n*math.exp(-t*12)
        elif name == "game-over":
            notes = [(659,0), (523,.42), (392,.84), (262,1.26), (196,1.7)]
            out = sum(.27 * math.copysign(1, math.sin(TAU*f*(t-a))) * pulse(t,a,.31) for f,a in notes)
            out += .07 * lowpass * math.exp(-t*.9)
        elif name.startswith("boss-"):
            # Ten original, non-voice electronic cues; reusable synthesis, no source overwrite.
            drift = {"boss-spawn": 66, "boss-question": 90, "boss-correct": 330,
                     "boss-wrong": 71, "boss-fury": 47, "boss-teleport": 420,
                     "boss-orb": 180, "boss-wave": 55, "boss-hit": 122,
                     "boss-death": 270}[name]
            if name in ("boss-spawn", "boss-teleport", "boss-death"):
                sweep = drift * (1 + 5 * t / duration) if name != "boss-death" else drift * (1 - .72 * t / duration)
                out = .27 * math.sin(TAU * sweep * t) + .13 * math.sin(TAU * sweep * 2.03 * t)
                out += .16 * held * (t / duration if name == "boss-spawn" else 1 - t / duration)
            elif name in ("boss-question", "boss-correct"):
                out = .33 * math.sin(TAU * drift * t) * math.exp(-t * 2)
                out += .13 * math.sin(TAU * (drift * 1.5) * t) * math.exp(-t * 3)
            elif name in ("boss-wrong", "boss-fury", "boss-hit"):
                out = .32 * math.sin(TAU * (drift * t - 25 * t * t)) * math.exp(-t * 3)
                out += .23 * held * math.exp(-t * 4) * (1 if int(t * 38) % 3 else .2)
            else:
                out = .3 * math.sin(TAU * (drift * t + 60 * t * t)) * math.exp(-t * 3)
                out += .15 * lowpass * math.exp(-t * 5)
        elif name == "anniversary-unlock":
            chord = (220,277.18,329.63,440)
            out = sum(.11 * math.sin(TAU*f*t) for f in chord) * (1-math.exp(-t*5)) * math.exp(-t*.68)
            out += sum(.12 * math.sin(TAU*f*(t-a)) * pulse(t,a,.24) for f,a in ((880,.4),(1108,.75),(1320,1.1),(1760,1.5)))
        else:
            raise ValueError(name)
        samples.append(out * envelope(t, duration))
    if name == "mirror-whisper":
        delay = round(.17 * RATE)
        for i in range(delay, len(samples)):
            samples[i] += samples[i-delay] * .18
    peak = max(abs(value) for value in samples)
    if peak < .01:
        raise RuntimeError(name + " is inaudible")
    gain = min(1.0, .78 / peak)
    samples = [value * gain for value in samples]
    peak = max(abs(value) for value in samples)
    if peak >= 1.0:
        raise RuntimeError(name + " clips")
    return samples, peak

SOUNDS = [
    ("telefono-ring", 2.0), ("telefono-pickup", .46), ("telefono-static", 1.4),
    ("telefono-hangup", .52), ("matrix-activate", 1.0), ("matrix-deactivate", .8),
    ("matrix-glitch", .7), ("matrix-secret", .85), ("mirror-whisper", 2.5),
    ("mirror-reveal", 1.6), ("vhs-pickup", .4), ("vhs-insert", 1.4),
    ("vhs-static", 2.2), ("vhs-play", .8), ("electric-flicker", 1.6),
    ("demon-hit", .75), ("demon-death", 2.5), ("heart-lost", .62),
    ("game-over", 3.1), ("anniversary-unlock", 2.8),
    ("demon-code-hit", .65), ("demon-taunt", 1.3), ("demon-shield", .62),
    ("boss-spawn", 4.4), ("boss-question", .7), ("boss-correct", .8),
    ("boss-wrong", .8), ("boss-fury", 1.3), ("boss-teleport", .65),
    ("boss-orb", .6), ("boss-wave", 1.2), ("boss-hit", .55), ("boss-death", 2.4),
    ("chest-open", .9), ("chest-close", .8), ("chest-locked", .4), ("reality-key", .8),
]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Regenerate generated effects")
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    for index, (name, duration) in enumerate(SOUNDS):
        path = args.out / (name + ".wav")
        if path.exists() and not args.force:
            print("SKIP existing " + path.name)
            continue
        samples, peak = synth(name, duration, index)
        pcm = struct.pack("<" + "h"*len(samples), *(max(-32768,min(32767,round(x*32767))) for x in samples))
        with wave.open(str(path), "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(RATE)
            wav.writeframes(pcm)
        if path.stat().st_size <= 44:
            raise RuntimeError("Empty file: " + str(path))
        print("%s: %.2fs, %d bytes, %d Hz, peak %.3f" % (path.name, len(samples)/RATE, path.stat().st_size, RATE, peak))

if __name__ == "__main__":
    main()
