"""Synthesise a soft lo-fi style background track + scene transition sound effects.

Everything is generated procedurally with numpy, so there is no copyright issue.
usage: make_audio.py out.wav duration_seconds [scene_start_seconds ...]
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 84
BEAT = 60 / BPM
BAR = BEAT * 4

NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def hz(name, octave):
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave - 4) - 9) / 12)


CHORDS = [  # Am - F - C - G
    [("A", 3), ("C", 4), ("E", 4)],
    [("F", 3), ("A", 3), ("C", 4)],
    [("C", 3), ("E", 4 - 1 + 1), ("G", 3)],
    [("G", 3), ("B", 3), ("D", 4)],
]


def env(n, a=0.02, r=0.4, sr=SR):
    t = np.arange(n) / sr
    e = np.minimum(t / a, 1.0) * np.exp(-t / r)
    return e


def add(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def pad(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.4, 0.4):
            s += np.sin(2 * np.pi * (f + det) * t) + 0.25 * np.sin(2 * np.pi * 2 * (f + det) * t)
    a = np.minimum(t / 0.6, 1.0) * np.minimum((dur - t) / 0.8, 1.0)
    return s * a / (len(freqs) * 2.5)


def pluck(f, dur=1.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)
    return s * env(n, 0.004, 0.35)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 55 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def hat(rng):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return rng.standard_normal(n) * np.exp(-t * 70) * 0.25


def whoosh(rng, dur=0.45):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # crude band sweep: moving-average length shrinks over time
    out = np.zeros(n)
    k = np.cumsum(noise)
    for L in (400, 150, 60):
        out += (k - np.concatenate([np.zeros(L), k[:-L]])) / L * 0.0
    sweep = np.sin(2 * np.pi * np.cumsum(180 + 1400 * (t / dur) ** 2) / SR)
    e = np.sin(np.pi * t / dur) ** 2
    return (0.35 * sweep + 0.25 * noise * np.exp(-t * 6)) * e


def pop(f=660):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t * (1 + 0.5 * np.exp(-t * 30))) * np.exp(-t * 16)


def build(duration, starts):
    rng = np.random.default_rng(7)
    n = int((duration + 1.0) * SR)
    music = np.zeros(n)
    bars = int(duration / BAR) + 2
    for b in range(bars):
        chord = CHORDS[b % 4]
        freqs = [hz(*c) for c in chord]
        add(music, b * BAR, pad(freqs, BAR + 0.5), 0.55)
        # bass
        bass = np.sin(2 * np.pi * hz(chord[0][0], 2) * np.arange(int(BAR * SR)) / SR) * env(int(BAR * SR), 0.01, 1.4)
        add(music, b * BAR, bass, 0.5)
        # arpeggio, eighth notes, gentle accents
        order = [0, 1, 2, 1, 0, 2, 1, 2]
        for k, idx in enumerate(order):
            f = hz(chord[idx][0], chord[idx][1] + 1)
            add(music, b * BAR + k * BEAT / 2, pluck(f), 0.22 if k % 2 == 0 else 0.14)
        # drums: soft kick on 1 and 3, hat on offbeats
        add(music, b * BAR, kick(), 0.45)
        add(music, b * BAR + 2 * BEAT, kick(), 0.35)
        for k in range(8):
            add(music, b * BAR + k * BEAT / 2 + BEAT / 4, hat(rng), 0.5 if k % 2 else 0.25)
    # gentle low-pass via moving average to take the edge off
    kern = np.ones(6) / 6
    music = np.convolve(music, kern, mode="same")
    music *= 0.5 / max(1e-6, np.max(np.abs(music)))
    sfx = np.zeros(n)
    for s in starts:
        add(sfx, max(0.0, s - 0.15), whoosh(rng), 0.7)
        add(sfx, s + 0.05, pop(), 0.35)
    mix = music + sfx
    # fade in/out
    t = np.arange(n) / SR
    mix *= np.minimum(t / 1.0, 1.0) * np.clip((duration + 0.8 - t) / 1.5, 0, 1)
    mix = np.tanh(mix * 1.2)
    return mix[: int((duration + 0.5) * SR)]


def write(path, mono):
    st = np.stack([mono, mono], axis=1)
    pcm = (np.clip(st, -1, 1) * 32767 * 0.9).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    out, dur = sys.argv[1], float(sys.argv[2])
    starts = [float(x) for x in sys.argv[3:]]
    write(out, build(dur, starts))
    print("wrote", out)
