import React, { useEffect, useState } from "react";
import { BEARD_STYLES, CUSTOM_AVATAR_DEFAULTS, GLASSES_STYLES, HAIR_STYLES } from "./avatarCustomization.js";

function SelectField({ label, value, options, onChange }) {
  return <label className="office-custom-field"><span>{label}</span>
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

function ColorField({ label, value, onChange }) {
  return <label className="office-custom-field office-custom-color"><span>{label}</span>
    <span className="office-color-control"><input type="color" value={value} onChange={event => onChange(event.target.value)}
      aria-label={`Color de ${label.toLowerCase()}`} /><span>{value.toUpperCase()}</span></span>
  </label>;
}

export default function AvatarCustomizer({ customization, onChange, onReset }) {
  const [draftName, setDraftName] = useState(customization.name);
  useEffect(() => { setDraftName(customization.name); }, [customization.name]);
  const commitName = () => onChange({ name: draftName.trim() || CUSTOM_AVATAR_DEFAULTS.name });
  return <aside className="office-customizer" aria-label="Personalizar avatar">
    <div className="office-customizer-head"><div><small>AVATAR PERSONALIZABLE</small><h2>Hacelo tuyo.</h2></div>
      <button type="button" onClick={onReset}>Restablecer</button></div>
    <label className="office-custom-field office-custom-name"><span>Tu nombre</span>
      <input type="text" maxLength={24} value={draftName} onChange={event => setDraftName(event.target.value)}
        onBlur={commitName} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}
        placeholder="Escribí tu nombre" autoComplete="off" /></label>
    <div className="office-customizer-section"><h3>Rostro</h3><div className="office-customizer-grid">
      <SelectField label="Pelo" value={customization.hairStyle} options={HAIR_STYLES} onChange={value => onChange({ hairStyle: value })} />
      <ColorField label="Pelo" value={customization.hairColor} onChange={value => onChange({ hairColor: value })} />
      <SelectField label="Barba" value={customization.beardStyle} options={BEARD_STYLES} onChange={value => onChange({ beardStyle: value })} />
      <ColorField label="Barba" value={customization.beardColor} onChange={value => onChange({ beardColor: value })} />
      <SelectField label="Gafas" value={customization.glasses} options={GLASSES_STYLES} onChange={value => onChange({ glasses: value })} />
    </div></div>
    <div className="office-customizer-section"><h3>Ropa</h3><div className="office-customizer-grid">
      <ColorField label="Remera" value={customization.shirtColor} onChange={value => onChange({ shirtColor: value })} />
      <ColorField label="Pantalón" value={customization.pantsColor} onChange={value => onChange({ pantsColor: value })} />
      <ColorField label="Zapatillas" value={customization.shoesColor} onChange={value => onChange({ shoesColor: value })} />
    </div></div>
    <p className="office-customizer-note">Los cambios se guardan en este navegador.</p>
  </aside>;
}
