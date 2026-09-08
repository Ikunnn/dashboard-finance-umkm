import React, { useRef, useState } from 'react';
import { Check, Copy, Download, MessageCircle, Printer, Store, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaksi } from '../types';
import { formatDateIndo, formatRupiah } from '../utils/formatters';

interface ReceiptModalProps {
  transaksi: Transaksi | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaksi, onClose }) => {
  const { usaha, showToast } = useApp();
  const [waNumber, setWaNumber] = useState('');
  const [showWaInput, setShowWaInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaksi) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      `*${usaha.nama_usaha}*`,
      `${usaha.alamat}`,
      `Telp: ${usaha.no_telepon}`,
      `--------------------------------`,
      `No. Trx : ${transaksi.nomor_transaksi}`,
      `Tanggal : ${formatDateIndo(transaksi.tanggal, true)}`,
      `Kasir   : ${transaksi.kasir_nama}`,
      `--------------------------------`,
      ...transaksi.items.map(
        i => `${i.qty}x ${i.nama_produk}\n   ${formatRupiah(i.harga_satuan)} = ${formatRupiah(i.subtotal)}`
      ),
      `--------------------------------`,
      `Subtotal: ${formatRupiah(transaksi.total_sebelum_diskon)}`,
      ...(transaksi.diskon_total > 0 ? [`Diskon  : -${formatRupiah(transaksi.diskon_total)}`] : []),
      `TOTAL   : ${formatRupiah(transaksi.total_bayar)}`,
      `Metode  : ${transaksi.metode_pembayaran}`,
      `Bayar   : ${formatRupiah(transaksi.nominal_dibayar)}`,
      `Kembali : ${formatRupiah(transaksi.kembalian)}`,
      `--------------------------------`,
      `Terima kasih telah berbelanja!`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    showToast('Teks struk berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!waNumber.trim()) {
      showToast('Masukkan nomor WhatsApp tujuan!', 'warning');
      return;
    }
    const cleanNumber = waNumber.replace(/[^0-9]/g, '');
    const targetNumber = cleanNumber.startsWith('0') ? '62' + cleanNumber.slice(1) : cleanNumber;

    const message = encodeURIComponent(
      `*STRUK DIGITAL - ${usaha.nama_usaha}*\n\n` +
      `No: ${transaksi.nomor_transaksi}\n` +
      `Waktu: ${formatDateIndo(transaksi.tanggal, true)}\n` +
      `Kasir: ${transaksi.kasir_nama}\n\n` +
      `*Rincian Pesanan:*\n` +
      transaksi.items.map(i => `• ${i.qty}x ${i.nama_produk} = ${formatRupiah(i.subtotal)}`).join('\n') +
      `\n\n*Total: ${formatRupiah(transaksi.total_bayar)}* (${transaksi.metode_pembayaran})\n` +
      (transaksi.kembalian > 0 ? `Kembalian: ${formatRupiah(transaksi.kembalian)}\n` : '') +
      `\nTerima kasih telah berkunjung ke ${usaha.nama_usaha}! 🙏`
    );

    const waUrl = `https://wa.me/${targetNumber}?text=${message}`;
    window.open(waUrl, '_blank');
    setShowWaInput(false);
    showToast('Membuka tautan WhatsApp untuk kirim struk...', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Struk Pembayaran</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Paper Style */}
        <div className="p-3 sm:p-6 bg-slate-100 flex justify-center overflow-y-auto flex-1">
          <div
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white p-4 sm:p-5 rounded-lg shadow-xs border border-slate-200 font-mono text-[11px] leading-relaxed text-slate-800"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 mx-auto mb-1 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs uppercase tracking-tight text-slate-900">
                {usaha.nama_usaha}
              </h4>
              <p className="text-[10px] text-slate-500">{usaha.alamat}</p>
              <p className="text-[10px] text-slate-500">Telp: {usaha.no_telepon}</p>
            </div>

            {/* Trx Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px] text-slate-600">
              <div className="flex justify-between">
                <span>No. Trx:</span>
                <span className="font-bold text-slate-900">{transaksi.nomor_transaksi}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateIndo(transaksi.tanggal, true)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaksi.kasir_nama}</span>
              </div>
              {transaksi.catatan && (
                <div className="flex justify-between pt-0.5 text-slate-500 italic">
                  <span>Catatan:</span>
                  <span className="truncate max-w-[180px]">{transaksi.catatan}</span>
                </div>
              )}
            </div>

            {/* Item List */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5">
              {transaksi.items.map(item => (
                <div key={item.id} className="text-[11px]">
                  <div className="font-medium text-slate-900">{item.nama_produk}</div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>
                      {item.qty} × {formatRupiah(item.harga_satuan)}
                      {item.diskon_item > 0 && ` (Disc -${formatRupiah(item.diskon_item)})`}
                    </span>
                    <span className="font-semibold text-slate-800">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(transaksi.total_sebelum_diskon)}</span>
              </div>
              {transaksi.diskon_total > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Diskon Transaksi</span>
                  <span>-{formatRupiah(transaksi.diskon_total)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-bold text-xs pt-1 border-t border-slate-200">
                <span>TOTAL BAYAR</span>
                <span>{formatRupiah(transaksi.total_bayar)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px] pt-1">
                <span>Metode Pembayaran</span>
                <span className="font-semibold">{transaksi.metode_pembayaran}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>Uang Diterima</span>
                <span>{formatRupiah(transaksi.nominal_dibayar)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-semibold text-[11px]">
                <span>Kembalian</span>
                <span>{formatRupiah(transaksi.kembalian)}</span>
              </div>
            </div>

            {/* Footer Greeting */}
            <div className="text-center pt-3 text-[10px] text-slate-500">
              <p className="font-semibold">*** TERIMA KASIH ***</p>
              <p className="text-[9px] mt-0.5">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            </div>
          </div>
        </div>

        {/* WhatsApp Sender Input if opened */}
        {showWaInput && (
          <div className="px-5 py-3 bg-emerald-50/70 border-t border-emerald-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Contoh: 08123456789"
              value={waNumber}
              onChange={e => setWaNumber(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              Kirim WA
            </button>
            <button
              onClick={() => setShowWaInput(false)}
              className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              Batal
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 grid grid-cols-3 gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2 rounded-xl bg-slate-900 text-white text-[11px] sm:text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Cetak</span>
          </button>
          <button
            onClick={() => setShowWaInput(!showWaInput)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2 rounded-xl bg-emerald-600 text-white text-[11px] sm:text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] sm:text-xs font-bold transition-colors active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
