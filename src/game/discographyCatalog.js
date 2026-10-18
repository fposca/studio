const artwork = {
  "9th-revelation.png": new URL("../assets/neonboy-animaciones/9th-revelation.png", import.meta.url).href,
  "glowshine.jpg": new URL("../assets/neonboy-animaciones/glowshine.jpg", import.meta.url).href,
  "glowshine (blue side).jpg": new URL("../assets/neonboy-animaciones/glowshine (blue side).jpg", import.meta.url).href,
  "gloom.jpg": new URL("../assets/neonboy-animaciones/gloom.jpg", import.meta.url).href,
  "gea.jpg": new URL("../assets/neonboy-animaciones/gea.jpg", import.meta.url).href,
  "gea 432ghz.jpg": new URL("../assets/neonboy-animaciones/gea 432ghz.jpg", import.meta.url).href,
  "arcade.jpg": new URL("../assets/neonboy-animaciones/arcade.jpg", import.meta.url).href,
  "nostalgia.jpg": new URL("../assets/neonboy-animaciones/nostalgia.jpg", import.meta.url).href,
  "holy fire.jpg": new URL("../assets/neonboy-animaciones/holy fire.jpg", import.meta.url).href,
  "unholy fire.jpg": new URL("../assets/neonboy-animaciones/unholy fire.jpg", import.meta.url).href,
  "secrets.jpg": new URL("../assets/neonboy-animaciones/secrets.jpg", import.meta.url).href,
  "apocalipsis.jpg": new URL("../assets/neonboy-animaciones/apocalipsis.jpg", import.meta.url).href,
  "krampus.jpg": new URL("../assets/neonboy-animaciones/krampus.jpg", import.meta.url).href,
  "silent moon.jpg": new URL("../assets/neonboy-animaciones/silent moon.jpg", import.meta.url).href
};
const asset = (filename) => artwork[filename];
const song = (name, videoId) => ({ name, videoId, url: `https://www.youtube.com/watch?v=${videoId}` });

export const BAND_LOGO = asset("9th-revelation.png");

export const DISCOGRAPHY_GROUPS = [
  { id: "instrumental", name: "Instrumentales", description: "Mundos sonoros de Neonboy" },
  { id: "band", name: "9th Revelation", description: "La banda con cantante" }
];

export const DISCOGRAPHY_ALBUMS = [
  {
    id: "glowshine", name: "Glowshine", group: "instrumental", cover: asset("glowshine.jpg"),
    tracks: [song("Anubis Servant", "bjlfrB-15P4"), song("Udjat", "gkcQWmWGUSY"), song("Prometheus in chains", "ILXM_AY3eF8"), song("Atlantis downfall", "nYhn2nfDezU")]
  },
  {
    id: "glowshine-blue", name: "Glowshine (Blue Side)", group: "instrumental", cover: asset("glowshine (blue side).jpg"),
    tracks: [song("Blue pegassus", "6Z2VuctF6eA"), song("Bellopheron", "1WKN7rDtgRk"), song("Chimera´s fire", "QXlhQasl2BU")]
  },
  {
    id: "gloom", name: "Gloom", group: "instrumental", cover: asset("gloom.jpg"),
    tracks: [song("Deimos", "gLToLcxY3G0"), song("Shadows", "Jw6PJq_0soU"), song("Speas Ultima Dea", "I1-M7y3Ph5k"), song("Djin", "w1XDa3CE0gc")]
  },
  {
    id: "gea", name: "Gea", group: "instrumental", cover: asset("gea.jpg"),
    tracks: [song("Heaven", "crwdMDBrKOY"), song("Jungle Nigthmares", "RHk1iTLg_cE"), song("Birdy", "_bNDstFGBqM"), song("Gea", "aOXgsXb9FFs")]
  },
  {
    id: "gea-432", name: "Gea 432 Ghz", group: "instrumental", cover: asset("gea 432ghz.jpg"),
    tracks: [song("Pied piper of Hammelin", "hjYeS1dcIrs"), song("Doomsday", "2hwi-EFLyi0"), song("Trauma", "NB9_BmO9FSE")]
  },
  { id: "arcade", name: "Arcade", group: "instrumental", cover: asset("arcade.jpg"), tracks: [song("Addams Freezer", "m81uLPyL7bs"), song("Wonder Boy", "RtRmC_xlhTk"), song("Guille´s Theme", "ca23VDJQZtw"), song("Mortal Kombat", "n9ALyEvClf8")] },
  { id: "nostalgia", name: "Nostalgia", group: "instrumental", cover: asset("nostalgia.jpg"), single: true, tracks: [song("Nostalgia", "DJ9CIEK_6xg")] },
  {
    id: "holy-fire", name: "Holy Fire", group: "band", cover: asset("holy fire.jpg"),
    tracks: [song("Jesus is King", "IsjwuOLXcFQ"), song("Breathless", "0VMa_8Z1N_Q"), song("Burn Lies", "-F3IXyy5IEE"), song("New Born", "XI4lYW59ueY")]
  },
  { id: "unholy-fire", name: "Unholy Fire", group: "band", cover: asset("unholy fire.jpg"), incoming: true, tracks: [] },
  {
    id: "secrets", name: "Secrets", group: "band", cover: asset("secrets.jpg"),
    tracks: [song("Secrets", "GPUjBo67lc0"), song("Streets of sleep", "dphYhou55WI"), song("Faster", "tVgu4IgDrx4")]
  },
  {
    id: "apocalipsis", name: "Apocalipsis", group: "band", cover: asset("apocalipsis.jpg"),
    tracks: [song("Oh Evil", "pDJ-_UvYx-0"), song("Time", "Z9wf2ZjcaJg"), song("Rainbow", "I1rqaGTO7cA")]
  },
  { id: "krampus", name: "Krampus", group: "band", cover: asset("krampus.jpg"), single: true, tracks: [song("Krampus", "8adOpLeaVcE")] },
  {
    id: "silent-moon", name: "Silent Moon", group: "band", cover: asset("silent moon.jpg"),
    tracks: [song("Lost Ones", "qbKiFNXbpvM"), song("Silent Moon", "pzRrbgYDYwc"), song("Going Under", "b7f1LLzo2zA")]
  }
].map((album, index) => ({ ...album, number: String(index + 1).padStart(2, "0") }));
