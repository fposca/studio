export const VIGILANTE_MAX_HEALTH = 8;
export const VIGILANTE_ARENA = Object.freeze({ minX: -11, maxX: 11, minZ: 10.7, maxZ: 26.5 });
export const VIGILANTE_CHECKPOINT = Object.freeze({ x: 0, z: 22, yaw: Math.PI, viewYaw: 0 });
export const VIGILANTE_NODES = Object.freeze([
  { id: "oeste", x: -8, z: 14 }, { id: "este", x: 8, z: 14 }, { id: "sur", x: 0, z: 24.5 },
]);
export function inVigilanteArena(x, z, margin = 0) {
  const a = VIGILANTE_ARENA;
  return x >= a.minX + margin && x <= a.maxX - margin && z >= a.minZ + margin && z <= a.maxZ - margin;
}
export function vigilanteShielded(p) {
  return Boolean(p?.vigilanteStarted && !p.vigilanteDefeated && p.vigilanteHealth > 0 && p.vigilanteHealth <= 4 && (p.vigilanteNodes?.length || 0) < 3);
}
export function vigilanteProjectileHits(a, b, player, radius = .65) {
  const px = player.x, py = (player.y || 0) + 1.05, pz = player.z;
  const dx = b.x-a.x, dy = b.y-a.y, dz = b.z-a.z;
  const t = Math.max(0, Math.min(1, ((px-a.x)*dx+(py-a.y)*dy+(pz-a.z)*dz)/(dx*dx+dy*dy+dz*dz || 1)));
  return (a.x+dx*t-px)**2+(a.y+dy*t-py)**2+(a.z+dz*t-pz)**2 < radius**2;
}
export function createVigilanteCombatState() {
  return { x: -9, z: 18, yaw: 0, action: "idle", age: 0, cooldown: 1, impact: false,
    invulnerable: 0, serial: 0, shots: 0, elapsed: 0, projectiles: Array.from({ length: 8 }, () => ({ active: false })) };
}
export function vigilanteAction(s, action) {
  if (s.action === action) return;
  s.action = action; s.age = 0; s.impact = false; s.serial++;
}
export function clearVigilanteProjectiles(s) { s.projectiles.forEach(p => { p.active = false; }); }
export function moveVigilante(s, player, speed, dt, canOccupy) {
  const dx = player.x-s.x, dz = player.z-s.z, d = Math.hypot(dx,dz);
  if (d < 2.15) return false;
  const stride = Math.min(speed*dt,d-2.15), heading = Math.atan2(dx,dz);
  // Try broad lateral steps instead of repeatedly pushing against a solid obstacle.
  for (const offset of [0,.65,-.65,1.2,-1.2]) {
    const x=s.x+Math.sin(heading+offset)*stride, z=s.z+Math.cos(heading+offset)*stride;
    if (inVigilanteArena(x,z,.85) && canOccupy(x,z)) {s.x=x;s.z=z;return true;}
  }
  return false;
}
export function stepVigilanteCombat(s, dt, { player, health, canOccupy = () => true, onDamage, onShot, paused = false }) {
  if (health <= 0) {clearVigilanteProjectiles(s);vigilanteAction(s,"death");return;}
  if (paused) return;
  dt=Math.min(.05,Math.max(0,dt)); s.elapsed+=dt; s.age+=dt;
  s.invulnerable=Math.max(0,s.invulnerable-dt);s.cooldown=Math.max(0,s.cooldown-dt);
  const phase2=health<=4, distance=Math.hypot(player.x-s.x,player.z-s.z);
  const face=Math.atan2(player.x-s.x,player.z-s.z);
  s.yaw+=Math.atan2(Math.sin(face-s.yaw),Math.cos(face-s.yaw))*Math.min(1,dt*6);
  for (const bullet of s.projectiles) if (bullet.active) {
    const a={x:bullet.x,y:bullet.y,z:bullet.z};
    bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;bullet.z+=bullet.vz*dt;bullet.life-=dt;
    if (vigilanteProjectileHits(a,bullet,player)) {bullet.active=false;onDamage?.(1);}
    else if (bullet.life<=0 || !inVigilanteArena(bullet.x,bullet.z,-2)) bullet.active=false;
  }
  if (s.action==="hurt") {if(s.age>=.55)vigilanteAction(s,"idle");return;}
  if (s.action==="ranged" || s.action==="melee") {
    const melee=s.action==="melee", impact=melee?.57:1.18, duration=melee?1.4:2.4;
    if (!s.impact && s.age>=impact) {
      s.impact=true;
      if (melee) {
        if(distance<2.85 && (player.y||0)<1.1 && Math.cos(face-s.yaw)>.25) onDamage?.(1);
      } else {
        for (const spread of phase2?[0,s.shots%2 ? .14 : -.14]:[0]) {
          const bullet=s.projectiles.find(p=>!p.active);if(!bullet)break;
          const yaw=face+spread, speed=phase2?9.2:7.6;
          Object.assign(bullet,{active:true,x:s.x+Math.sin(yaw)*.8,y:1.6,z:s.z+Math.cos(yaw)*.8,
            vx:Math.sin(yaw)*speed,vz:Math.cos(yaw)*speed,vy:(((player.y||0)+1.05)-1.6)/Math.max(.3,distance/speed),life:4});
          s.shots++;onShot?.();
        }
      }
    }
    if(s.age>=duration){vigilanteAction(s,"idle");s.cooldown=phase2?.65:1.05;}
    return;
  }
  if(s.cooldown<=0 && distance<24){vigilanteAction(s,distance<2.65?"melee":"ranged");return;}
  const moved=moveVigilante(s,player,phase2?2.9:2.15,dt,canOccupy);
  vigilanteAction(s,moved?"walk":"idle");
}
