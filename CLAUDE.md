# Contexto del proyecto: canal de YouTube de curiosidades del cuerpo humano

Habla con el usuario en **español**. Los videos y sus subtítulos van en **inglés**.

## Objetivo del usuario
Monetizar canales de YouTube con un video largo y Shorts sacados de él. Nicho: educación y medicina, con curiosidades y datos del cuerpo humano al estilo TikTok. Videos de animación 2D, con subtítulos animados, ganchos fuertes y listos para descargar y subir. Quiere que se usen los skills instalados en `.claude/skills/`. Nada se publica solo: la subida la hace el usuario a mano.

## Dónde guardar los videos
Carpeta del usuario en su PC: `D:\CLAUDE CODE\Video-youtube`
```
Video-youtube/
├── Full/      video largo .mp4 (+ versión comprimida), .en.srt, UPLOAD KIT.md
└── Shorts/<título>/   <título> - shortN.mp4 y .en.srt
```
En el repo esa misma estructura está en `Video-youtube/`. Mantén ese formato en los videos nuevos.

## Lo ya hecho
- Video largo "You Were Born With 270 Bones: 8 Body Facts That Sound Fake" (4:10, 1080p).
- 5 Shorts verticales: huesos, estómago, ojo, cerebro, ADN.
- Subtítulos palabra por palabra, música y efectos de sonido, ilustraciones 2D propias.
- Los 8 hechos: bones, stomach, eye, blood, brain, nerve, skin, dna (`curiosidades-cuerpo/src/data.ts`).
- `curiosidades-cuerpo/UPLOAD_KIT.md`: título, descripción con capítulos, miniatura y títulos de los Shorts.
- Hay otro proyecto sin relación en `cruz-dados-3d/` (modelo 3D de una cruz). No tocarlo.

## Proyecto de video: `curiosidades-cuerpo/` (Remotion 4.0.534)
- `src/data.ts`: guion, hechos y tiempos. Para un video nuevo se empieza aquí.
- `src/art/*.tsx`: 8 ilustraciones 2D (una por hecho). Cada hecho nuevo necesita su ilustración.
- `src/FactScene.tsx`, `src/TitleScenes.tsx`, `src/Video.tsx`, `src/Root.tsx`: escenas y composiciones (`Long`, `Short-bones`, `Short-stomach`, `Short-eye`, `Short-brain`, `Short-dna`).
- `tools/make_audio.py`: genera música y efectos con numpy. `tools/scripts_srt.ts`: genera los SRT. `tools/stills.mjs`: imágenes de prueba.
- `render_all.sh`: renderiza todo sin audio a `out/silent/`; el audio se mezcla después con ffmpeg.
- Se instala con `npm i`. El navegador se fija en `remotion.config.ts` (en la nube: `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`; en el PC del usuario hay que quitar o ajustar esa ruta).

## Skills instalados (`.claude/skills/`)
`yt-*` (script, package, chapters, shorts, viral, seo, hook, title, thumbnail-brief, plan, etc.), `youtube`, `viral-*`, los 12 `remotion-*` oficiales, `finish-shorts`, `video-editor`, `teleprompter`, `graphic-carousel`. Los scripts Python de los `yt-*` se ejecutan con `python3 -I`.
Requieren claves de terceros que NO están puestas: `buffer-scheduler`, `youtube-thumbnail` (Gemini), `notion-brain` y parte de los de datos de YouTube.

## Límites del entorno en la nube (no aplican igual en el PC local)
Solo se llegaba a npm y PyPI. HuggingFace, ElevenLabs, Bing TTS y GitHub releases estaban bloqueados, por eso no hay voz con IA. En el PC local se puede probar una voz con IA (por ejemplo Piper o Kokoro) o grabar con el skill `teleprompter`.

## Pendiente
1. Copiar `Video-youtube/` a `D:\CLAUDE CODE\Video-youtube` (ver `EMPEZAR_SESION_LOCAL.md`).
2. Añadir más hechos con su ilustración para pasar de 8 minutos y poder poner anuncios intermedios.
3. Voz en off. Si el usuario aporta un MP3, volver a sincronizar los subtítulos.
4. Revisar los datos médicos antes de publicar. YouTube exige contenido original y no producido en masa; evitar videos repetitivos sin valor añadido.
5. Más videos: seguir con nuevos temas del cuerpo (usar `yt-viral`, `yt-script`, `yt-package`, `yt-shorts`).
