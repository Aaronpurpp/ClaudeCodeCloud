# Prompt para sesión local de Claude Code

Abre una terminal en `D:\CLAUDE CODE`, ejecuta `claude` y pega esto:

---

Primero lee `CLAUDE.md` en la raíz del repo: tiene todo el contexto de lo que hicimos y lo que sigue pendiente.

Quiero traer a mi PC los videos de YouTube que se hicieron en una sesión en la nube.

1. Si `D:\CLAUDE CODE` no es un repositorio git, clona `https://github.com/aaronpurpp/claudecodecloud` en `D:\CLAUDE CODE\claudecodecloud`. Si ya está clonado, haz `git fetch`.
2. Cambia a la rama `claude/magical-brown-12j8th` (`git checkout claude/magical-brown-12j8th && git pull`).
3. Copia la carpeta `Video-youtube` de ese repo a `D:\CLAUDE CODE\Video-youtube`, conservando esta estructura:
   - `Full/`: el video largo (.mp4), la versión comprimida de 20 MB, el .en.srt y el UPLOAD KIT.md
   - `Shorts/<título>/`: short1 a short5 (.mp4 y .en.srt)
4. Verifica que los 14 archivos llegaron y dime el tamaño de cada uno.
5. No publiques nada en YouTube ni en redes. Solo copia y organiza.

El proyecto de Remotion está en `curiosidades-cuerpo/` en esa misma rama, por si luego quiero seguir editando. Los skills están en `.claude/skills/`. Cuando termines de copiar, quiero seguir haciendo videos nuevos del mismo canal.
