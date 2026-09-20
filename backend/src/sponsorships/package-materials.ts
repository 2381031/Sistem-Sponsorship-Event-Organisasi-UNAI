export type MaterialKind = 'logo' | 'promosi' | 'produk';
export type SponsorFile = { kind: MaterialKind; name: string; url: string; mime: string };

// Requirements follow the actual benefits, including custom packages.
export function packageMaterials(paket: { deskripsi_keuntungan?: string | null }) {
  const text = (paket.deskripsi_keuntungan || '').toLowerCase();
  return {
    logo: /\blogo\b/.test(text),
    promosi: /brosur|media promosi|materi promosi/.test(text),
    produk: /produk|barang|sample|sampel/.test(text),
  };
}

export function mergeMaterials(paket: { deskripsi_keuntungan?: string | null }, previous: SponsorFile[], uploaded: SponsorFile[]) {
  const rules = packageMaterials(paket);
  const replaced = new Set(uploaded.map(file => file.kind));
  return [...previous.filter(file => !replaced.has(file.kind)), ...uploaded].filter(file => rules[file.kind]);
}
