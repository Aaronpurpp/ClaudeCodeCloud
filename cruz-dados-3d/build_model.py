#!/usr/bin/env python3
"""
Cruz de dados con Cristo + cadena Figaro  ->  modelos 3D (GLB).

Todo es procedural (sin Blender):
  * dados: caja redondeada analitica con puntos (hoyuelos) tallados
  * piedras rojas: gemas facetadas engastadas en los puntos del frente
  * Cristo: campo de distancia (SDF) con primitivas suaves + marching cubes
  * bale: tira ancha con hueco pasante
  * cadena Figaro (3 eslabones cortos + 1 largo) cerrada alrededor del cuello

Unidades: milimetros.  +Z = frente de la pieza, +Y = arriba.

Uso:  python3 build_model.py [--fast]
"""
import os
import sys
import time
import numpy as np
import trimesh
from skimage import measure
from scipy import ndimage
from PIL import Image, ImageDraw, ImageFont

try:
    import fast_simplification
except Exception:  # opcional
    fast_simplification = None

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "models")
FAST = "--fast" in sys.argv

# --------------------------------------------------------------------------
# Medidas (sacadas de las fotos: dado ~167 px = 14 mm en la foto frontal)
# --------------------------------------------------------------------------
S = 14.0            # lado del dado
DEPTH = 9.5         # grosor del dado
RC = 1.7            # radio de esquina del dado
PITCH = S - 0.10    # separacion entre dados (casi se tocan)
HZ = DEPTH / 2      # cara frontal del dado (z)
PIP_R = 1.55        # radio del punto (hoyuelo)
PIP_Q = 0.262 * S   # separacion de los puntos desde el centro
PIP_D = 0.95        # profundidad del hoyuelo
GEM_R = 1.42
STEP = 0.15 if not FAST else 0.25     # resolucion de malla en caras de dados
VOX = 0.12 if not FAST else 0.2       # resolucion del Cristo


# --------------------------------------------------------------------------
# Utilidades de malla  (Part = (V, F, N))
# --------------------------------------------------------------------------
def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def combine(parts):
    vs, fs, ns, off = [], [], [], 0
    for V, F, N in parts:
        vs.append(V)
        fs.append(F + off)
        ns.append(N)
        off += len(V)
    return np.vstack(vs), np.vstack(fs), np.vstack(ns)


def transform(part, R=None, t=None):
    V, F, N = part
    if R is not None:
        V = V @ R.T
        N = N @ R.T
    if t is not None:
        V = V + np.asarray(t)
    return V, F, N


def rotz(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.0]])


def vertex_normals(V, F):
    return np.asarray(trimesh.Trimesh(V, F, process=False).vertex_normals)


def to_trimesh(part, material, name):
    V, F, N = part
    m = trimesh.Trimesh(vertices=V, faces=F, vertex_normals=N, process=False)
    m.visual = trimesh.visual.TextureVisuals(material=material)
    m.metadata["name"] = name
    return m


def pbr(color, metal, rough, emissive=None, name=None):
    return trimesh.visual.material.PBRMaterial(
        name=name,
        baseColorFactor=[int(c * 255) for c in color] + [255],
        metallicFactor=metal,
        roughnessFactor=rough,
        emissiveFactor=emissive if emissive is not None else [0, 0, 0],
    )


# --------------------------------------------------------------------------
# Dado: caja redondeada con hoyuelos
# --------------------------------------------------------------------------
def pip_layout(n, q=PIP_Q):
    return {
        1: [(0, 0)],
        2: [(-q, q), (q, -q)],
        3: [(-q, q), (0, 0), (q, -q)],
        "3b": [(q, q), (0, 0), (-q, -q)],
        4: [(-q, q), (q, q), (-q, -q), (q, -q)],
        5: [(-q, q), (q, q), (0, 0), (-q, -q), (q, -q)],
        6: [(-q, q), (q, q), (-q, 0), (q, 0), (-q, -q), (q, -q)],
        "top2": [(-q, q), (q, q)],
        "2b": [(q, q), (-q, -q)],
        0: [],
    }[n]


def pip_depth_fn(centers, R=PIP_R, d0=PIP_D, w=0.28):
    centers = np.asarray(centers, dtype=float).reshape(-1, 2)

    def f(X, Y):
        out = np.zeros_like(X)
        for cx, cy in centers:
            r = np.hypot(X - cx, Y - cy)
            wall = smoothstep((R - r) / w)
            bowl = 0.78 + 0.22 * (1 - np.clip(r / R, 0, 1) ** 2)
            out = np.maximum(out, d0 * wall * bowl)
        return out
    return f


def rounded_box(size, r, step, front_fn=None, back_fn=None, skip=()):
    """Caja redondeada con malla densa en el plano XY (caras +-z) y
    desplazamiento opcional (hoyuelos / grabado) en las caras +-z."""
    sx, sy, sz = size
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    cx = np.linspace(-hx, hx, int(round(sx / step)) + 1)
    cy = np.linspace(-hy, hy, int(round(sy / step)) + 1)
    t = np.linspace(0, 1, 13)
    cz = np.unique(np.round(np.concatenate([-hz + r * t, [0.0], hz - r * t]), 9))
    half = np.array([hx, hy, hz])
    inner_h = half - r

    parts = []
    specs = [
        ("+z", (0, cx), (1, cy), 2, +hz),
        ("-z", (0, cx), (1, cy), 2, -hz),
        ("+y", (0, cx), (2, cz), 1, +hy),
        ("-y", (0, cx), (2, cz), 1, -hy),
        ("+x", (1, cy), (2, cz), 0, +hx),
        ("-x", (1, cy), (2, cz), 0, -hx),
    ]
    for name, (ia, ca), (ib, cb), fi, fv in specs:
        if name in skip:
            continue
        A, B = np.meshgrid(ca, cb, indexing="ij")
        P = np.zeros(A.shape + (3,))
        P[..., ia], P[..., ib], P[..., fi] = A, B, fv
        inner = np.clip(P, -inner_h, inner_h)
        d = P - inner
        L = np.linalg.norm(d, axis=-1, keepdims=True)
        Q = inner + r * d / L
        flat = (np.abs(d[..., fi]) > 0.999999 * L[..., 0])
        if name in ("+z", "-z"):
            fn = front_fn if name == "+z" else back_fn
            if fn is not None:
                sign = 1 if name == "+z" else -1
                dep = fn(Q[..., 0], Q[..., 1])
                Q[..., 2] = np.where(flat, Q[..., 2] - sign * dep, Q[..., 2])
        na, nb = A.shape
        idx = np.arange(na * nb).reshape(na, nb)
        a, b, c, e = idx[:-1, :-1], idx[1:, :-1], idx[1:, 1:], idx[:-1, 1:]
        F = np.stack([np.stack([a, b, c], -1), np.stack([a, c, e], -1)], 2).reshape(-1, 3)
        V = Q.reshape(-1, 3)
        # orientacion hacia fuera
        n0 = np.cross(V[F[0, 1]] - V[F[0, 0]], V[F[0, 2]] - V[F[0, 0]])
        want = np.zeros(3)
        want["xyz".index(name[1])] = 1 if name[0] == "+" else -1
        if n0 @ want < 0:
            F = F[:, ::-1]
        parts.append((V, F))
    V = np.vstack([p[0] for p in parts])
    off, Fs = 0, []
    for pv, pf in parts:
        Fs.append(pf + off)
        off += len(pv)
    F = np.vstack(Fs)
    m = trimesh.Trimesh(V, F, process=False)
    m.merge_vertices(digits_vertex=6)
    m.remove_unreferenced_vertices()
    V, F = np.asarray(m.vertices), np.asarray(m.faces)
    return V, F, vertex_normals(V, F)


# --------------------------------------------------------------------------
# Gema facetada (talla brillante simplificada, sombreado plano)
# --------------------------------------------------------------------------
def gem(center_xy, z_girdle, R=GEM_R, h=0.85, n=16):
    cx, cy = center_xy
    k = np.arange(n)
    ang = k * 2 * np.pi / n
    ang_h = (k + 0.5) * 2 * np.pi / n

    def ring(a, rad, z):
        return np.stack([cx + rad * np.cos(a), cy + rad * np.sin(a), np.full(n, z)], 1)

    A = ring(ang, R, z_girdle)
    B = ring(ang_h, 0.80 * R, z_girdle + 0.40 * h)
    C = ring(ang, 0.53 * R, z_girdle + h)
    tris = []
    for i in range(n):
        j = (i + 1) % n
        tris.append((A[i], A[j], B[i]))
        tris.append((A[j], B[j], B[i]))
    C2 = np.roll(C, -1, axis=0)  # C2[i] entre B[i] y B[i+1]
    for i in range(n):
        j = (i + 1) % n
        tris.append((B[i], B[j], C2[i]))
        tris.append((B[j], C2[j], C2[i]))
    top = np.array([cx, cy, z_girdle + h])
    for i in range(n):
        j = (i + 1) % n
        tris.append((C[i], C[j], top))
    # base plana
    bot = np.array([cx, cy, z_girdle - 0.05])
    for i in range(n):
        j = (i + 1) % n
        tris.append((A[j], A[i], bot))
    T = np.array(tris)
    V = T.reshape(-1, 3)
    F = np.arange(len(V)).reshape(-1, 3)
    n_ = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0])
    n_ /= np.linalg.norm(n_, axis=1, keepdims=True) + 1e-12
    N = np.repeat(n_, 3, axis=0)
    return V, F, N


# --------------------------------------------------------------------------
# SDF helpers (Cristo y bale)
# --------------------------------------------------------------------------
def smin(a, b, k):
    h = np.maximum(k - np.abs(a - b), 0) / k
    return np.minimum(a, b) - h * h * k * 0.25


def smax(a, b, k):
    return -smin(-a, -b, k)


def sd_ellipsoid(X, Y, Z, c, r, rot=0.0):
    x, y = X - c[0], Y - c[1]
    if rot:
        cs, sn = np.cos(rot), np.sin(rot)
        x, y = cs * x + sn * y, -sn * x + cs * y
    z = Z - c[2]
    k0 = np.sqrt((x / r[0]) ** 2 + (y / r[1]) ** 2 + (z / r[2]) ** 2)
    k1 = np.sqrt((x / r[0] ** 2) ** 2 + (y / r[1] ** 2) ** 2 + (z / r[2] ** 2) ** 2)
    return k0 * (k0 - 1) / np.maximum(k1, 1e-9)


def sd_roundcone(X, Y, Z, a, b, r1, r2):
    a, b = np.asarray(a, float), np.asarray(b, float)
    ba = b - a
    l2 = ba @ ba
    rr = r1 - r2
    a2 = l2 - rr * rr
    il2 = 1.0 / l2
    px, py, pz = X - a[0], Y - a[1], Z - a[2]
    y = px * ba[0] + py * ba[1] + pz * ba[2]
    z = y - l2
    qx, qy, qz = px * l2 - ba[0] * y, py * l2 - ba[1] * y, pz * l2 - ba[2] * y
    x2 = qx * qx + qy * qy + qz * qz
    y2 = y * y * l2
    z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d1 = np.sqrt(x2 + z2) * il2 - r2
    d2 = np.sqrt(x2 + y2) * il2 - r1
    d3 = (np.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1
    return np.where(np.sign(z) * a2 * z2 > k, d1, np.where(np.sign(y) * a2 * y2 < k, d2, d3))


class Field:
    """Rejilla SDF; cada primitiva solo se evalua en su caja."""

    def __init__(self, lo, hi, res):
        self.lo = np.asarray(lo, float)
        self.res = res
        self.shape = tuple(int(np.ceil((h - l) / res)) + 1 for l, h in zip(lo, hi))
        self.F = np.full(self.shape, 6.0, np.float32)
        self.ax = [self.lo[i] + np.arange(self.shape[i]) * res for i in range(3)]

    def _box(self, cmin, cmax, margin):
        sl = []
        for i in range(3):
            i0 = int(np.floor((cmin[i] - margin - self.lo[i]) / self.res))
            i1 = int(np.ceil((cmax[i] + margin - self.lo[i]) / self.res)) + 1
            sl.append(slice(max(i0, 0), min(i1, self.shape[i])))
        return tuple(sl)

    def add(self, fn, cmin, cmax, k=0.8, carve=False):
        sl = self._box(cmin, cmax, k + 0.4)
        X = self.ax[0][sl[0]][:, None, None]
        Y = self.ax[1][sl[1]][None, :, None]
        Z = self.ax[2][sl[2]][None, None, :]
        d = fn(X, Y, Z).astype(np.float32)
        cur = self.F[sl]
        if carve:
            self.F[sl] = smax(cur, -d, k)
        else:
            self.F[sl] = smin(cur, d, k)

    def ellipsoid(self, c, r, k=0.8, rot=0.0, carve=False):
        m = max(r) + 0.2
        self.add(lambda X, Y, Z: sd_ellipsoid(X, Y, Z, c, r, rot),
                 np.array(c) - m, np.array(c) + m, k, carve)

    def limb(self, a, b, r1, r2, k=0.8):
        a, b = np.array(a, float), np.array(b, float)
        m = max(r1, r2) + 0.2
        self.add(lambda X, Y, Z: sd_roundcone(X, Y, Z, a, b, r1, r2),
                 np.minimum(a, b) - m, np.maximum(a, b) + m, k)

    def mesh(self):
        F = self.F.copy()
        # cerrar la malla salvo por el fondo (queda dentro del dado)
        F[0, :, :] = F[-1, :, :] = 6.0
        F[:, 0, :] = F[:, -1, :] = 6.0
        F[:, :, -1] = 6.0
        verts, faces, normals, _ = measure.marching_cubes(
            F, level=0.0, spacing=(self.res,) * 3, gradient_direction="descent")
        verts = verts + self.lo
        return verts, faces, normals


# --------------------------------------------------------------------------
# Cristo en relieve  (coordenadas: x,y del plano de la cruz; z = altura sobre
# la cara frontal del dado central; origen = centro del dado central)
# --------------------------------------------------------------------------
def build_corpus():
    t0 = time.time()
    fld = Field(lo=(-21.0, -40.5, -1.2), hi=(21.0, 6.5, 6.4), res=VOX)
    K, k = 1.0, 0.45     # suavizado grande (masas) y pequeno (detalle)

    # ---- tronco (pecho ancho -> cintura estrecha)
    fld.ellipsoid((0, -7.6, 1.8), (4.9, 3.6, 1.9), K)             # caja toracica alta
    fld.ellipsoid((0, -11.4, 1.6), (4.0, 3.2, 2.0), K)            # costillar
    fld.ellipsoid((0, -15.0, 1.2), (3.0, 2.8, 1.7), K)            # abdomen / cintura
    fld.ellipsoid((0, -18.3, 1.3), (3.3, 2.6, 1.9), K)            # cadera
    # ---- cuello y hombros
    fld.limb((0, -3.0, 1.7), (0, -4.8, 1.5), 1.0, 1.55, K)
    for s in (-1, 1):
        fld.ellipsoid((s * 5.1, -4.9, 1.7), (2.2, 1.8, 1.5), K)   # deltoides
    # ---- brazos
    for s in (-1, 1):
        fld.limb((s * 5.2, -5.0, 1.6), (s * 10.9, -3.3, 1.2), 1.55, 1.15, K)
        fld.limb((s * 10.9, -3.3, 1.2), (s * 16.1, 1.6, 1.0), 1.15, 0.8, K)
        # mano abierta
        fld.ellipsoid((s * 17.4, 2.6, 1.0), (1.3, 1.1, 0.55), 0.5, rot=s * -0.5)
        for ang, ln in ((100, 1.9), (80, 2.2), (60, 2.1), (40, 1.8)):
            a_ = np.deg2rad(ang if s > 0 else 180 - ang)
            p0 = np.array([s * 17.4, 2.6, 1.0]) + np.array([np.cos(a_) * 0.5, np.sin(a_) * 0.5, 0])
            p1 = p0 + np.array([np.cos(a_), np.sin(a_), 0.0]) * ln
            fld.limb(p0, p1, 0.36, 0.3, 0.25)
        a_ = np.deg2rad(150 if s > 0 else 30)
        p0 = np.array([s * 16.7, 1.7, 1.0])
        fld.limb(p0, p0 + np.array([np.cos(a_), np.sin(a_) * 0.4, 0]) * 1.5, 0.38, 0.3, 0.25)
    # ---- piernas delgadas y pies cruzados
    for s in (-1, 1):
        fld.limb((s * 1.5, -20.5, 1.4), (s * 1.4, -27.8, 1.1), 1.65, 1.25, 0.7)
        fld.limb((s * 1.4, -27.8, 1.1), (s * 0.7, -34.2, 1.0), 1.25, 0.8, 0.7)
    fld.ellipsoid((-0.1, -36.0, 1.1), (2.0, 1.6, 0.8), 0.5)
    fld.ellipsoid((0.4, -36.6, 1.5), (1.4, 1.3, 0.7), 0.45)
    # ---- cabeza (ladeada, pelo largo hasta los hombros y barba)
    fld.ellipsoid((-0.2, -0.1, 2.8), (2.45, 3.1, 2.4), K, rot=0.14)
    for s_ in (-1, 1):                                              # melena lateral
        fld.limb((s_ * 2.1 - 0.2, 1.8, 2.0), (s_ * 3.0 - 0.2, -4.3, 1.6), 1.05, 0.75, 0.5)
    fld.ellipsoid((-0.2, 2.5, 3.1), (2.3, 0.8, 1.8), 0.5)           # nacimiento del pelo
    fld.ellipsoid((-0.3, -2.4, 3.4), (1.45, 1.7, 1.15), 0.55)       # barba
    fld.ellipsoid((-0.2, -0.9, 5.0), (0.45, 1.0, 0.7), 0.35)        # nariz
    fld.ellipsoid((-0.2, 0.55, 4.7), (1.7, 0.32, 0.5), 0.3)         # ceja
    for s_ in (-1, 1):
        fld.ellipsoid((-0.2 + s_ * 0.95, 0.15, 5.1), (0.6, 0.32, 0.5), 0.3, carve=True)  # ojos
    fld.ellipsoid((-0.2, -1.9, 4.8), (0.9, 0.18, 0.5), 0.2, carve=True)                  # boca
    # ---- musculatura (magro)
    for s_ in (-1, 1):
        fld.ellipsoid((s_ * 2.3, -7.6, 3.1), (2.1, 1.15, 0.65), 0.5)         # pectoral
        for y in (-11.9, -13.7, -15.5):
            fld.ellipsoid((s_ * 1.05, y, 2.9), (0.95, 0.62, 0.5), 0.45)      # abdominales
    fld.ellipsoid((0, -8.2, 4.35), (0.25, 2.0, 0.4), 0.3, carve=True)          # esternon
    fld.ellipsoid((0, -13.7, 4.0), (0.12, 3.0, 0.35), 0.3, carve=True)       # linea alba
    # ---- pano de pureza (banda en la cadera, nudo lateral y caida)
    fld.ellipsoid((0.0, -19.4, 2.3), (3.8, 2.2, 1.35), 0.6)
    fld.ellipsoid((1.6, -18.7, 3.3), (1.5, 1.3, 1.0), 0.5)
    fld.limb((1.3, -19.4, 3.0), (1.9, -25.2, 2.1), 1.35, 0.8, 0.5)
    fld.limb((-1.0, -20.0, 2.6), (-1.4, -24.0, 2.0), 1.15, 0.7, 0.5)

    V, F, N = fld.mesh()
    # quitar caras totalmente por debajo de la cara del dado (invisibles)
    zmax = V[F][:, :, 2].max(axis=1)
    keep = zmax > -0.15
    F = F[keep]
    V = V.copy()
    V[:, 2] += HZ
    if fast_simplification is not None and not FAST:
        pts, tri = fast_simplification.simplify(V.astype(np.float32), F.astype(np.int32),
                                                target_reduction=0.55)
        V, F = pts.astype(float), tri.astype(np.int64)
    m = trimesh.Trimesh(V, F, process=False)
    m.remove_unreferenced_vertices()
    V, F = np.asarray(m.vertices), np.asarray(m.faces)
    N = vertex_normals(V, F)
    print(f"  cristo: {len(F)} tris  ({time.time()-t0:.1f}s)")
    return V, F, N


# --------------------------------------------------------------------------
# Bale (tira ancha con hueco pasante en X)
# --------------------------------------------------------------------------
def sd_rbox(X, Y, Z, c, h, r):
    qx, qy, qz = np.abs(X - c[0]) - (h[0] - r), np.abs(Y - c[1]) - (h[1] - r), np.abs(Z - c[2]) - (h[2] - r)
    out = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2 + np.maximum(qz, 0) ** 2)
    return out + np.minimum(np.maximum(qx, np.maximum(qy, qz)), 0) - r


BAIL_Y0 = PITCH + S / 2 - 0.7          # base del bale (se hunde un poco en el dado)
BAIL_H = 9.7
BAIL_CY = BAIL_Y0 + BAIL_H / 2
HOLE_CY, HOLE_H, HOLE_Z = BAIL_CY + 0.15, 6.4, 2.7
LINK_YC = HOLE_CY + 4.0                # centro del eslabon que cuelga del bale


def build_bail():
    res = 0.07 if not FAST else 0.12
    lo = np.array([-5.5, BAIL_Y0 - 0.5, -3.6])
    hi = np.array([5.5, BAIL_Y0 + BAIL_H + 0.5, 3.6])
    ax = [np.arange(l, h + res, res) for l, h in zip(lo, hi)]
    X, Y, Z = ax[0][:, None, None], ax[1][None, :, None], ax[2][None, None, :]
    outer = sd_rbox(X, Y, Z, (0, BAIL_CY, 0), (4.4, BAIL_H / 2, 2.9), 2.3)
    hole = sd_rbox(X, Y, Z, (0, HOLE_CY, 0), (9.0, HOLE_H / 2, HOLE_Z / 2), 0.9)
    f = smax(outer, -hole, 0.15).astype(np.float32)
    f[0], f[-1], f[:, 0], f[:, -1], f[:, :, 0], f[:, :, -1] = 6, 6, 6, 6, 6, 6
    v, fc, _, _ = measure.marching_cubes(f, 0.0, spacing=(res,) * 3, gradient_direction="descent")
    v = v + lo
    return v, fc, vertex_normals(v, fc)


# --------------------------------------------------------------------------
# Eslabones Figaro
# --------------------------------------------------------------------------
LINK_A, LINK_B = 0.62, 0.50           # semiejes de la seccion (en plano / normal)
SHORT_L, LONG_L, LINK_W = 7.0, 12.2, 4.6


def link_mesh(L, W=LINK_W, a=LINK_A, b=LINK_B, nseg=64, ns=12):
    """Eslabon en forma de estadio. Plano XY, eje largo = X, normal = Z."""
    Rc = W / 2 - a
    Ls = L - W
    # centro-linea parametrizada por longitud de arco
    per = 2 * Ls + 2 * np.pi * Rc
    s = np.linspace(0, per, nseg, endpoint=False)
    P = np.zeros((nseg, 2))
    Nout = np.zeros((nseg, 2))
    seg1, seg2, seg3 = Ls, np.pi * Rc, Ls
    for i, si in enumerate(s):
        if si < seg1:                                     # recta superior (->)
            P[i] = (-Ls / 2 + si, Rc); Nout[i] = (0, 1)
        elif si < seg1 + seg2:                            # semicirculo derecho
            th = (si - seg1) / Rc
            P[i] = (Ls / 2 + Rc * np.sin(th), Rc * np.cos(th)); Nout[i] = (np.sin(th), np.cos(th))
        elif si < seg1 + seg2 + seg3:                     # recta inferior (<-)
            P[i] = (Ls / 2 - (si - seg1 - seg2), -Rc); Nout[i] = (0, -1)
        else:                                             # semicirculo izquierdo
            th = (si - seg1 - seg2 - seg3) / Rc
            P[i] = (-Ls / 2 - Rc * np.sin(th), -Rc * np.cos(th)); Nout[i] = (-np.sin(th), -np.cos(th))
    phi = np.linspace(0, 2 * np.pi, ns, endpoint=False)
    V = np.zeros((nseg, ns, 3))
    Nn = np.zeros_like(V)
    for j, p in enumerate(phi):
        off = np.cos(p) * a * np.c_[Nout, np.zeros(nseg)] + np.sin(p) * b * np.array([0, 0, 1.0])
        V[:, j] = np.c_[P, np.zeros(nseg)] + off
        nrm = np.cos(p) / a * np.c_[Nout, np.zeros(nseg)] + np.sin(p) / b * np.array([0, 0, 1.0])
        Nn[:, j] = nrm / np.linalg.norm(nrm, axis=1, keepdims=True)
    idx = np.arange(nseg * ns).reshape(nseg, ns)
    i0, i1 = idx, np.roll(idx, -1, axis=0)
    j1 = np.roll(np.arange(ns), -1)
    q = np.stack([i0[:, :], i1[:, :], i1[:, j1], i0[:, j1]], -1).reshape(-1, 4)
    F = np.concatenate([q[:, [0, 1, 2]], q[:, [0, 2, 3]]])
    Vf, Nf = V.reshape(-1, 3), Nn.reshape(-1, 3)
    # orientacion: normales hacia fuera
    fn = np.cross(Vf[F[:, 1]] - Vf[F[:, 0]], Vf[F[:, 2]] - Vf[F[:, 0]])
    if (fn * Nf[F[:, 0]]).sum() < 0:
        F = F[:, ::-1]
    return Vf, F, Nf


# --------------------------------------------------------------------------
# Texto grabado en el reverso
# --------------------------------------------------------------------------
def engraving_mask(w_mm, h_mm, ppm=22):
    W, H = int(w_mm * ppm), int(h_mm * ppm)
    img = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(img)
    big = ImageFont.truetype(os.path.join(HERE, "fonts", "great-vibes.ttf"), int(8.6 * ppm))
    small = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf", int(2.5 * ppm))
    d.text((W / 2 - 1.0 * ppm, H / 2 - 1.2 * ppm), "Abara", font=big, fill=255, anchor="mm")
    d.text((W / 2 + 0.2 * ppm, H / 2 + 3.6 * ppm), "On God Timing", font=small, fill=255, anchor="mm")
    # rubrica subrayada
    d.line([(W / 2 - 8.6 * ppm, H / 2 + 1.7 * ppm), (W / 2 + 5.2 * ppm, H / 2 + 0.9 * ppm)], fill=255, width=int(0.17 * ppm))
    img = img.filter(__import__("PIL.ImageFilter", fromlist=["x"]).GaussianBlur(0.7))
    return np.asarray(img, dtype=np.float32) / 255.0, ppm


def back_plate_fn(w_mm, h_mm, pips):
    mask, ppm = engraving_mask(w_mm, h_mm)
    H, W = mask.shape
    pipf = pip_depth_fn(pips)

    def f(X, Y):
        # el reverso se lee desde atras: derecha del espectador = -x
        u = (-X + w_mm / 2) * ppm
        v = (h_mm / 2 - Y) * ppm
        m = ndimage.map_coordinates(mask, [v, u], order=1, mode="constant", cval=0)
        return np.maximum(pipf(X, Y), 0.20 * smoothstep(m * 1.6))
    return f


# --------------------------------------------------------------------------
# Ensamblado del colgante
# --------------------------------------------------------------------------
def build_pendant(with_gems=True):
    """Devuelve dict nombre -> Part  (metal / gemas separados)."""
    t0 = time.time()
    rng = np.random.default_rng(7)
    # (col, fila, caras frontales, cara trasera)
    dice = {
        "top":    ((0, 1),  5,    6),
        "left":   ((-1, 0), 4,    None),
        "center": ((0, 0),  "top2", None),
        "right":  ((1, 0),  4,    None),
        "low1":   ((0, -1), 0,    4),
        "low2":   ((0, -2), "2b",  5),
    }
    metal, gems = [], []
    for name, ((gx, gy), front, back) in dice.items():
        is_arm = name in ("left", "center", "right")
        jit = rng.normal(0, 1, 3)
        ang = np.deg2rad(jit[0] * 0.9)
        pos = np.array([gx * PITCH + jit[1] * 0.10, gy * PITCH + jit[2] * 0.10, rng.normal(0, 0.12)])
        R = rotz(ang)
        front_pips = pip_layout(front)
        if is_arm:
            depth = DEPTH - 3.0                       # el frente queda en z = HZ
            zshift, front_local = HZ - depth / 2, depth / 2
            V, F, N = rounded_box((S, S, depth), RC, STEP,
                                  front_fn=pip_depth_fn(front_pips), skip=("-z",))
        else:
            zshift, front_local = 0.0, HZ
            back_pips = pip_layout(back) if back else []
            V, F, N = rounded_box((S, S, DEPTH), RC, STEP,
                                  front_fn=pip_depth_fn(front_pips),
                                  back_fn=pip_depth_fn(back_pips))
        place = pos + np.array([0, 0, zshift])
        metal.append(transform((V, F, N), R, place))
        if with_gems:
            for (px, py) in front_pips:
                gems.append(transform(gem((px, py), front_local - PIP_D + 0.30), R, place))
    # placa trasera unica del brazo (con grabado)
    arm_w, arm_h, arm_d = 3 * PITCH + S - PITCH, S - 0.05, 3.5
    plate_pips = [(PITCH + 0.0, 0.0), (-PITCH - PIP_Q, PIP_Q), (-PITCH + PIP_Q, -PIP_Q)]
    pf = back_plate_fn(arm_w, arm_h, plate_pips)
    V, F, N = rounded_box((arm_w, arm_h, arm_d), 1.15, 0.10 if not FAST else 0.2,
                          front_fn=None, back_fn=pf, skip=("+z",))
    metal.append(transform((V, F, N), None, [0, 0, -HZ + arm_d / 2]))
    # bale
    metal.append(build_bail())
    # cristo
    metal.append(build_corpus())
    out = {"metal": combine(metal)}
    if gems:
        out["gems"] = combine(gems)
    print(f"  colgante listo ({time.time()-t0:.1f}s)  metal={len(out['metal'][1])} tris")
    return out


# --------------------------------------------------------------------------
# Collar: cadena Figaro cerrada alrededor del cuello
# --------------------------------------------------------------------------
NECK_RX, NECK_RZ, DROP, PEXP = 48.0, 52.0, 150.0, 2.0


def neck_curve(n=40000):
    th = np.linspace(-np.pi, np.pi, n)
    P = np.stack([NECK_RX * np.sin(th),
                  -DROP * ((1 + np.cos(th)) / 2) ** PEXP,
                  NECK_RZ * np.cos(th)], 1)
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    return th, P, s


def build_chain():
    th, P, s = neck_curve()
    Ltot = s[-1]
    # secuencia figaro 3 cortos + 1 largo, simetrica respecto al vertice j=0
    def kind(j): return LONG_L if j % 4 == 0 else SHORT_L
    m = 1
    while True:
        N = 4 * m
        js = list(range(-N // 2, N // 2))
        lens = np.array([kind(j) for j in js])
        sp = (lens + np.roll(lens, -1)) / 2 - 4 * LINK_A - 0.5
        if sp.sum() >= Ltot:
            break
        m += 1
    sp *= Ltot / sp.sum()
    s_vertex = s[len(s) // 2]
    # centros: j=0 en el vertice
    cum = np.concatenate([[0], np.cumsum(sp)])
    cs = s_vertex + cum[:N] - cum[N // 2]
    cs = np.mod(cs, Ltot)
    print(f"  cadena: {N} eslabones, longitud {Ltot:.0f} mm")

    def at(sv):
        i = np.searchsorted(s, sv).clip(1, len(s) - 1)
        w = (sv - s[i - 1]) / (s[i] - s[i - 1] + 1e-12)
        p = P[i - 1] * (1 - w) + P[i] * w
        ds = 0.5
        i2 = np.searchsorted(s, min(sv + ds, s[-1])).clip(1, len(s) - 1)
        i1 = np.searchsorted(s, max(sv - ds, 0)).clip(1, len(s) - 1)
        t = P[i2] - P[i1 - 1]
        return p, t / np.linalg.norm(t)

    cache = {}
    parts = []
    for jj, j in enumerate(js):
        L = kind(j)
        if L not in cache:
            cache[L] = link_mesh(L)
        p, T = at(cs[jj])
        R = np.array([p[0] / NECK_RX ** 2, 0, p[2] / NECK_RZ ** 2])
        R = R / np.linalg.norm(R)
        Nrm = R - (R @ T) * T
        Nrm /= np.linalg.norm(Nrm)
        Bn = np.cross(T, Nrm)
        w = Nrm if j % 2 == 0 else Bn           # alternar plano del eslabon
        v = np.cross(w, T)
        M = np.stack([T, v, w], 1)              # columnas: x_local, y_local, z_local
        parts.append(transform(cache[L], M, p))
    return combine(parts)


# --------------------------------------------------------------------------
# Materiales
# --------------------------------------------------------------------------
GOLD = pbr((1.0, 0.66, 0.18), 1.0, 0.10, name="oro_pulido")
SILVER = pbr((0.96, 0.96, 0.97), 1.0, 0.07, name="rodio_pulido")
RUBY = pbr((0.70, 0.03, 0.02), 0.0, 0.05, emissive=[0.10, 0.0, 0.0], name="circon_rojo")


def export(parts_dict, metal_mat, path, extra=()):
    scene = trimesh.Scene()
    scene.add_geometry(to_trimesh(parts_dict["metal"], metal_mat, "metal"), node_name="metal", geom_name="metal")
    if "gems" in parts_dict:
        scene.add_geometry(to_trimesh(parts_dict["gems"], RUBY, "piedras"), node_name="piedras", geom_name="piedras")
    for name, part, mat in extra:
        scene.add_geometry(to_trimesh(part, mat, name), node_name=name, geom_name=name)
    scene.export(path)
    print(f"  -> {path}  ({os.path.getsize(path)/1e6:.1f} MB)")


def main():
    os.makedirs(OUT, exist_ok=True)
    print("Colgante (oro + circones rojos)")
    gold = build_pendant(with_gems=True)
    export(gold, GOLD, os.path.join(OUT, "colgante_oro.glb"))

    print("Colgante (version rodio / fundicion sin piedras)")
    silver = {"metal": gold["metal"]}
    export(silver, SILVER, os.path.join(OUT, "colgante_plata.glb"))

    print("Collar completo (colgante + cadena Figaro)")
    chain = build_chain()
    off = np.array([0.0, -DROP - LINK_YC, NECK_RZ])
    moved = {k: transform(v, None, off) for k, v in gold.items()}
    export(moved, GOLD, os.path.join(OUT, "collar_oro.glb"), extra=[("cadena", chain, GOLD)])


if __name__ == "__main__":
    main()
