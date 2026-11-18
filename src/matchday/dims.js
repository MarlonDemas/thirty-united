import { KIT_HEX } from './config.js';
// Shared dimensions (metres). Pitch axis: z (105 m, goals at z = -52.5 north / +52.5 south), x is the 68 m width.
// North = -z (scoreboard stand, the goal the guest shoots at). South = +z (entrance plaza, players' tunnel).
export const D = {
  pitchL: 105, pitchW: 68, runoff: 6,
  halfL: 52.5, halfW: 34,
  // inner edge of the stands (front wall) - rounded rectangle
  bowl: { hx: 41.5, hz: 60, R: 12 },
  rowDepth: 0.8, rise: 0.4,
  lowerRows: 25, upperRows: 20,
  lowerY0: 1.0,           // tread height of lower row 0
  lowerTop: 10.6,         // tread height of lower row 24
  midWallTop: 13.4,       // fascia between the tiers
  upperY0: 13.4,          // tread height of upper row 0
  upperD0: 20,            // upper tier starts here (offset d from the front wall)
  backD: 36,              // back wall / facade offset
  roofIn: 21, roofOut: 39.5, roofYIn: 25.2, roofYRoot: 29.4,
  seatPitch: 0.72,
  slot: 2.4,              // half-width of the players' tunnel box
  gateHalf: 7,            // half-width of the entrance passage
  accent: KIT_HEX.home,
};
export const lowerY = (r) => D.lowerY0 + D.rise * r;
export const upperY = (r) => D.upperY0 + D.rise * r;
export const roofDeckY = (d) => D.roofYIn + (d - D.roofIn) * (D.roofYRoot - D.roofYIn) / (36.5 - D.roofIn);
