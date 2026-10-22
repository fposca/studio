// Hugo's catalogue is independent from NeonBoy's record-store catalogue.
// Only tracks and artwork supplied by the artist are listed here.
const covers = {
  cosmos: new URL("../assets/neonboy-animaciones/estudio-musica/la-vaca-el-ternero-y-el-cosmos.jpg", import.meta.url).href,
  overdrive: new URL("../assets/neonboy-animaciones/estudio-musica/bs-as-overdrive.jpg", import.meta.url).href,
  voodoo: new URL("../assets/neonboy-animaciones/estudio-musica/voodoo-women-blues.jpg", import.meta.url).href
};
const track = (name, videoId, playlistIndex) => ({
  name, videoId, playlistIndex,
  url: `https://www.youtube.com/watch?v=${videoId}&list=OLAK5uy_lEeJ0CwKP65HF9xQARaKLW101VKl0vRkE&index=${playlistIndex}`
});

export const HUGO_ALBUMS = [
  {
    id: "el-ternero-la-vaca-y-el-cosmos", artist: "Hugo Mendez",
    name: "El ternero, la vaca y el cosmos", cover: covers.cosmos,
    totalTracks: 13, status: "11 temas disponibles · 2 pendientes", year: null,
    tracks: [
      track("Purple Moon", "lsPBYmDfpoo", 1),
      track("Black ovejas", "VOt7wCFFR0g", 2),
      track("ataque masivo a la red", "VUsde8TKMlU", 3),
      track("Galactic souvenir", "0tQMMHEcT5s", 4),
      track("Vintage robot", "9wVU0JVW9d4", 5),
      track("estilo roswell", "LS78ZJLX9i4", 6),
      track("kurt", "Mg1HJptJ2S8", 7),
      track("auto atascado", "M2RVSRqzSrs", 10),
      track("cirque", "tnfIznAT6Cg", 11),
      track("muere arturo", "Ikv9SR2OL2E", 12),
      track("invasor español", "GlL1xmctKM4", 13)
    ]
  },
  { id: "bs-as-overdrive", artist: "Hugo Mendez", name: "BS AS Overdrive", cover: covers.overdrive, totalTracks: null, status: "Canciones pendientes", year: null, tracks: [] },
  { id: "voodoo-women-blues", artist: "Hugo Mendez", name: "Voodoo Women Blues", cover: covers.voodoo, totalTracks: null, status: "Canciones pendientes", year: null, tracks: [] }
];

export const getHugoAlbum = (id) => HUGO_ALBUMS.find((album) => album.id === id);
