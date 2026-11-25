import { actorGuideShot } from "./halloweenGuideCamera.js";

export const WELCOME_TOUR_STEPS = [
  { id: "welcome", label: "Bienvenida", eyebrow: "UN RECORRIDO MUSICAL INTERACTIVO", title: "Entr\u00e1 en la m\u00fasica.",
    text: "Esta es la tienda de NeonBoy. Camin\u00e1 entre sus discos, escuch\u00e1 sus canciones y descubr\u00ed una historia escondida entre los vinilos.", action: "Escuchar. Explorar. Jugar.", icon: "music" },
  { id: "instrumental", label: "NeonBoy", eyebrow: "PRIMERA PARADA / NEONBOY", title: "Mundos sin palabras.",
    text: "Descubr\u00ed los discos instrumentales de NeonBoy. Acercate a una portada, toc\u00e1 E para abrir el disco y eleg\u00ed una canci\u00f3n para escucharla.", action: "Abrir disco", hint: "En el celular, toc\u00e1 E o el bot\u00f3n con el nombre del disco.", icon: "disc", group: "instrumental" },
  { id: "band", label: "9th Revelation", eyebrow: "SEGUNDA PARADA / 9TH REVELATION", title: "Otra voz. El mismo universo.",
    text: "Tambi\u00e9n pod\u00e9s escuchar a 9th Revelation, la banda con cantante. Acercate a sus discos y toc\u00e1 E: cada portada abre sus canciones.", action: "Abrir disco", hint: "Tambi\u00e9n encontr\u00e1s ambos proyectos en el bot\u00f3n DISCOS.", icon: "disc", group: "band" },
  { id: "story", label: "La historia", eyebrow: "ADEM\u00c1S DE LA M\u00daSICA / UNA AVENTURA", title: "La tienda guarda un secreto.",
    text: "Conoc\u00e9 a sus personajes, habl\u00e1 con todos y reun\u00ed las pistas. Hay objetos ocultos, desaf\u00edos y algo extra\u00f1o detr\u00e1s de esta noche.", action: "Hablar con un personaje", hint: "La GU\u00cdA te indica qu\u00e9 falta para avanzar en el juego.", icon: "people" },
  { id: "return", label: "Tu turno", eyebrow: "AHORA VOS ELEG\u00cdS", title: "La tienda es tuya.",
    text: "Pod\u00e9s quedarte escuchando m\u00fasica o seguir las pistas de la aventura. NeonBoy te espera: recorr\u00e9 este mundo a tu ritmo.", action: "Movete con el joystick o WASD. Arrastr\u00e1 para mirar.", icon: "compass" },
];

export function welcomeTourShots({ player, albums, positions, actors, obstacles, layout }) {
  const hero = actorGuideShot(player, player.yaw + Math.PI, obstacles, layout);
  function albumShot(group, preferred) {
    const index = albums.findIndex(a => a.id === preferred && a.group === group);
    const spot = positions[index >= 0 ? index : albums.findIndex(a => a.group === group)];
    return { position: { x: spot.x + Math.sin(spot.yaw) * 4.2, y: 2.9, z: spot.z + Math.cos(spot.yaw) * 4.2 },
      focus: { x: spot.x, y: 2.15, z: spot.z }, duration: 8, travel: 2.6 };
  }
  const people = ["roxy", "rulo"].flatMap(id => {
    const actor = actors.get(id);
    return actor ? [{ ...actorGuideShot(actor.root.position, actor.root.rotation.y, obstacles, layout), step: 3, duration: 4.8, travel: 1.8 }] : [];
  });
  return { stops: [
    { ...hero, step: 0, duration: 5, travel: 1.8 },
    { ...albumShot("instrumental", "gloom"), step: 1 },
    { ...albumShot("band", "holy-fire"), step: 2 },
    ...people,
    { return: true, step: 4, duration: 5, travel: 2.6 },
  ] };
}
