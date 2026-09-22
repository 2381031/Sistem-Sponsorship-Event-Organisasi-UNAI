import React from 'react';
import { packageMaterials, SponsorFile, MaterialKind } from '../../backend/src/sponsorships/package-materials';
import { documentUrl } from './DocumentGallery';

export type MaterialSelection = Partial<Record<MaterialKind, File[]>>;
const labels = { logo: 'Logo sponsor', promosi: 'Brosur / materi promosi', produk: 'Foto / katalog produk atau barang' };

export function attachMaterials(data: FormData, selection: MaterialSelection) {
  for (const [kind, files] of Object.entries(selection)) for (const file of files || []) data.append(kind, file);
}

export function validateSelection(paket: any, selection: MaterialSelection, proof?: File | null, existing: SponsorFile[] = []) {
  const rules = packageMaterials(paket);
  if (rules.logo && !selection.logo?.length && !existing.some(file => file.kind === 'logo')) return 'Upload logo sponsor sesuai manfaat paket.';
  const files = Object.values(selection).flat();
  if ([...files, ...(proof ? [proof] : [])].reduce((sum, file) => sum + file.size, 0) > 4 * 1024 * 1024) return 'Total bukti pembayaran dan lampiran maksimal 4 MB per pengiriman.';
  for (const [kind, selected] of Object.entries(selection)) {
    if (selected!.length > (kind === 'logo' ? 1 : 3)) return 'Maksimal satu logo dan tiga berkas per jenis lampiran.';
    if (selected!.some(file => !(kind === 'logo' ? ['image/png', 'image/jpeg'] : ['image/png', 'image/jpeg', 'application/pdf']).includes(file.type))) return 'Logo harus JPG/PNG. Lampiran promosi/produk boleh JPG, PNG, atau PDF.';
  }
  return '';
}

export function MaterialInputs({ paket, value, onChange, existing = [] }: {
  paket: { deskripsi_keuntungan?: string | null }; value: MaterialSelection;
  onChange: (value: MaterialSelection) => void; existing?: SponsorFile[];
}) {
  const rules = packageMaterials(paket);
  return <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs">
    <p className="font-bold">Berkas pendukung sesuai paket sponsorship</p>
    {!Object.values(rules).some(Boolean) && <p>Paket ini tidak mencantumkan logo atau promosi produk; tidak ada lampiran tambahan yang diwajibkan.</p>}
    {(Object.keys(rules) as MaterialKind[]).filter(kind => rules[kind]).map(kind => <label key={kind} className="block space-y-1">
      <span className="font-bold">{labels[kind]} {kind === 'logo' ? '(wajib)' : '(opsional)'}</span>
      <input type="file" multiple={kind !== 'logo'} accept={kind === 'logo' ? 'image/png,image/jpeg' : 'image/png,image/jpeg,application/pdf'}
        required={kind === 'logo' && !existing.some(file => file.kind === 'logo') && !value.logo?.length}
        onChange={event => onChange({ ...value, [kind]: Array.from(event.target.files || []) })} className="block w-full" />
      <span className="block text-gray-500">{value[kind]?.map(file => file.name).join(', ') || (existing.some(file => file.kind === kind) ? 'Berkas tersimpan tetap dipakai jika tidak diganti.' : 'Belum dipilih.')}</span>
    </label>)}
    {rules.produk && <p>Unggah foto atau katalog untuk koordinasi produk/sampel. Penyerahan barang fisik diatur dengan organisasi.</p>}
    <p>JPG/PNG untuk logo; JPG/PNG/PDF untuk lampiran. Maksimal 3 berkas tiap jenis lampiran. Total seluruh berkas termasuk bukti pembayaran maksimal 4 MB. Pilihan baru mengganti berkas tersimpan pada jenis yang sama.</p>
  </div>;
}

export function MaterialFiles({ files = [] }: { files?: SponsorFile[] }) {
  return <div className="space-y-2 rounded-xl border border-gray-100 p-3 text-xs">
    <p className="font-bold">Logo dan Lampiran Sponsor</p>
    {!files.length && <p className="text-gray-500">Belum ada berkas pendukung sponsorship yang diunggah.</p>}
    {files.map((file, index) => {
      const url = documentUrl(file.url);
      return <div key={`${file.url}-${index}`}>
        <span className="font-bold">{labels[file.kind]}: </span>
        {url && ['image/png', 'image/jpeg'].includes(file.mime) && <a href={url} target="_blank" rel="noreferrer" className="block my-2"><img src={url} alt={`${labels[file.kind]}: ${file.name}`} loading="lazy" decoding="async" className="max-h-40 max-w-full rounded-lg object-contain" /></a>}
        {url ? <a href={url} target="_blank" rel="noreferrer" className="break-all text-blue-700 underline">{file.name}</a> : <span>Berkas tidak tersedia</span>}
      </div>;
    })}
  </div>;
}
