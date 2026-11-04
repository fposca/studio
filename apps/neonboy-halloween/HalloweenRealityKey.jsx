import React, { useId } from "react";

export default function HalloweenRealityKey() {
  const id = useId();
  return <section className="halloween-key-reward" aria-label="Llave recibida" role="status">
    <svg viewBox="0 0 260 150" role="img" aria-label="Llave de bronce con el ojo de la realidad grabado">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0.3" y2="1">
          <stop stopColor="#ffe5a0" /><stop offset=".28" stopColor="#c49b52" /><stop offset=".5" stopColor="#f4d99c" /><stop offset=".62" stopColor="#75502b" /><stop offset="1" stopColor="#d0a568" />
        </linearGradient>
      </defs>
      <ellipse cx="137" cy="125" rx="91" ry="8" fill="#000" opacity=".24" />
      <g transform="rotate(-24 130 75)" stroke="#523821" strokeLinejoin="round">
        <path d="M81 66H220V78H212V94H201V84H193V94H181V78H81Z" fill={`url(#${id}-gold)`} strokeWidth="2" />
        <path d="M96 69H215M101 75H179" stroke="#ffe6ad" opacity=".7" />
        <path d="M87 71C87 92 73 105 54 105S19 92 19 71 35 37 54 37 87 50 87 71ZM75 71C75 57 66 49 54 49S31 57 31 71 41 93 54 93 75 85 75 71Z" fill={`url(#${id}-gold)`} strokeWidth="2" fillRule="evenodd" />
        <path d="M26 65C29 51 40 43 54 43" fill="none" stroke="#fff0c6" strokeWidth="2" opacity=".8" />
        <path d="M33 71Q54 51 75 71Q54 91 33 71Z" fill="#342b24" stroke="#d8b578" strokeWidth="2" />
        <circle cx="54" cy="71" r="7" fill={`url(#${id}-gold)`} /><circle cx="54" cy="71" r="2" fill="#211c20" />
        <path d="M91 63V81M98 63V81" stroke="#e6c887" strokeWidth="3" />
        <path d="M135 68L139 75 143 68 147 75" fill="none" stroke="#775433" strokeWidth="1.5" />
      </g>
    </svg>
    <div><small>OBJETO OBTENIDO</small><h3>La llave de la realidad</h3>
      <p>Encontraste una llave antigua. El ojo grabado coincide con el de una caja de madera.</p>
      <strong>Dentro est&aacute;n las gafas de realidad de NeonBoy.</strong>
      <span>Guardaste la llave.</span>
    </div>
  </section>;
}
