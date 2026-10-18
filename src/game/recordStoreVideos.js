export const ROCKOLA_VIDEOS = [
  { title: "New Born", videoId: "bPp4YoSrbmo", album: "Holy Fire" },
  { title: "Jesus is King", videoId: "poQC8HuC-PA", album: "Holy Fire" },
  { title: "Burn Lies", videoId: "Xb70o3hEcTE", album: "Holy Fire" },
  { title: "Streets of Sleep", videoId: "O0ssacselcM", album: "Secrets" },
  { title: "Faster", videoId: "jXaHt5579Ow", album: "Secrets" },
  { title: "Secrets", videoId: "X2IuWWmkTWg", album: "Secrets" },
  { title: "Lost Ones", videoId: "cBjELadNCMU", album: "Silent Moon" },
  { title: "Rainbow", videoId: "qcSKHG0US10", album: "Apocalipsis" },
  { title: "Oh Evil", videoId: "3yUhiSBNfJA", album: "Apocalipsis" },
  { title: "Krampus", videoId: "8adOpLeaVcE", album: "Krampus" }
].map((video) => ({ ...video, url: `https://www.youtube.com/watch?v=${video.videoId}` }));
