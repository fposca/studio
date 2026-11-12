export function createOfficeVoicePlayer() {
  let active = null;
  let generation = 0;

  function stop() {
    generation += 1;
    if (!active) return;
    active.pause();
    active.removeAttribute("src");
    active = null;
  }

  function play(clips, onComplete) {
    stop();
    const currentGeneration = generation;
    const queue = clips.filter(Boolean);

    function next(index) {
      if (currentGeneration !== generation) return;
      if (index >= queue.length) {
        onComplete?.();
        return;
      }

      const audio = new Audio(queue[index]);
      audio.preload = "auto";
      active = audio;
      let advanced = false;
      const advance = () => {
        if (advanced || currentGeneration !== generation) return;
        advanced = true;
        active = null;
        next(index + 1);
      };
      audio.addEventListener("ended", advance, { once: true });
      audio.addEventListener("error", advance, { once: true });
      audio.play().catch(advance);
    }

    next(0);
  }

  return { play, stop };
}
