// matchday-rsvp: the spoken description of the aim point, used for the polite live-region announcements. Pure: no DOM, no three.js.
// (x, y) = the aim in metres on the goal plane; halfW / goalH = the goal mouth's half width and height.
export const aimText = (x, y, halfW, goalH) => {
  const inMouth = Math.abs(x) <= halfW - 0.05 && y <= goalH - 0.05;
  if (!inMouth) return y > goalH - 0.05 ? 'Aiming over the bar' : 'Aiming wide of the post';
  const side = x < -1.2 ? 'left' : x > 1.2 ? 'right' : 'centre', lvl = y < 0.8 ? 'low' : y > 1.6 ? 'high' : 'middle';
  if (Math.abs(x) >= 2.3 && y >= 1.45) return `Top ${side} corner, a sure goal`;
  return side === 'centre' && lvl === 'middle' ? 'Aiming at the centre' : side === 'centre' ? `Aiming ${lvl} centre` : lvl === 'middle' ? `Aiming ${side}` : `Aiming ${lvl} ${side}`;
};
