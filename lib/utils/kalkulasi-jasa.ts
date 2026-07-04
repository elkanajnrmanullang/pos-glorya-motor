type TingkatKesulitan = 'mudah' | 'sedang' | 'sulit';

export function hitungHargaJasa(
  hargaDasar: number,
  ccMotor: number,
  kesulitan: TingkatKesulitan
): number {
  let increment = 0;

// Menentukan increment berdasarkan ccMotor untuk harga jasa
  if (ccMotor < 250) {
    increment = 3000;
  } else if (ccMotor >= 250 && ccMotor < 400) {
    increment = 7000;
  } else {
    increment = 9000;
  }

  if (kesulitan === 'mudah') return hargaDasar;
  if (kesulitan === 'sedang') return hargaDasar + increment;
  if (kesulitan === 'sulit') return hargaDasar + (increment * 2);

  return hargaDasar;
}