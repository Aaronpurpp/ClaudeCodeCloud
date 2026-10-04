# Cruz de dados con Cristo + cadena Figaro (modelo 3D)

Modelo procedural hecho a partir de las 5 fotos de referencia (frontal oro, frontal/reverso rodio, lateral y detalle de cadena).

| Archivo | Contenido |
|---|---|
| `models/colgante_oro.glb` | Colgante en oro con circones rojos (como la foto del oro) |
| `models/colgante_plata.glb` | Misma pieza en rodio, sin piedras (como la fundicion de las fotos) |
| `models/collar_oro.glb` | Colgante + cadena Figaro (3 cortos + 1 largo) cerrada, colgando del bale |
| `viewer/index.html` | Visor three.js (`python3 -m http.server -d viewer`). Parametros: `?model=oro|plata|collar&auto=0&ry=35&rx=8&zoom=2&ty=-9&ui=0` |
| `renders/` | Vistas de comprobacion |
| `build_model.py` | Generador (`python3 build_model.py`, `--fast` para borrador) |

Unidades: mm. +Z = frente, +Y = arriba. El colgante mide ~42 x 59 mm; los dados, 14 mm.
Reverso grabado: "Abara / On God Timing".
