type TingkatKesulitan = 'mudah' | 'sedang' | 'sulit';

export function hitungHargaJasa(
  hargaDasar: number,
  ccMotor: number,
  kesulitan: TingkatKesulitan
): number {
  let increment = 0;

  if (ccMotor < 250) {
    increment = 7000;
  } else if (ccMotor >= 250 && ccMotor < 400) {
    increment = 10000;
  } else {
    increment = 13000;
  }

  if (kesulitan === 'mudah') return hargaDasar;
  if (kesulitan === 'sedang') return hargaDasar + increment;
  if (kesulitan === 'sulit') return hargaDasar + (increment * 2);

  return hargaDasar;
}