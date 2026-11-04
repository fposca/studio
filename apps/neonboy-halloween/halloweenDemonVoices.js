// Match each spoken line to the artist recording without renaming the source MP3s.
const DESCRIPTIVE_VOICE_MARKERS = {
  1: "mascara-",
  2: "verdadera-forma",
  3: "lucecita",
  4: "borrando-del-sistema",
};

export function findDemonVoiceUrl(voiceUrls, lineId) {
  const numbered = `demon-regueton-${String(lineId).padStart(2, "0")}.mp3`;
  const direct = voiceUrls[`./voices/${numbered}`] || voiceUrls[`../../halloween/${numbered}`];
  if (direct) return direct;
  const marker = DESCRIPTIVE_VOICE_MARKERS[lineId];
  if (!marker) return null;
  const entry = Object.entries(voiceUrls).find(([path]) =>
    path.split("/").at(-1).toLowerCase().includes(marker)
  );
  return entry?.[1] || null;
}
