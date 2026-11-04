export const EMPTY_REALITY_CHEST = Object.freeze({ keyOwned: false, open: false, collected: false });

// This quest is local to Halloween. The key is retained so the box can be reopened.
export function advanceRealityChest(state, action) {
  switch (action) {
    case "takeKey": return state.keyOwned ? state : { ...state, keyOwned: true };
    case "toggle": return state.keyOwned ? { ...state, open: !state.open } : state;
    case "collect": return state.keyOwned && state.open && !state.collected ? { ...state, collected: true } : state;
    case "reset": return EMPTY_REALITY_CHEST;
    default: return state;
  }
}
