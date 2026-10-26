import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Download, MessageSquare, Check, ShieldCheck, Printer, Copy, AlertTriangle, Sparkles, Share2, Eye, ExternalLink } from 'lucide-react';
import { formatPhoneNumber, formatReadableDate } from '../utils/phone';

export interface BillDetails {
  invoiceNo: string;
  botId: string;
  formattedNumber: string;
  purchaseDate: string;
  expiryDate: string;
  durationLabel: string;
  price: string;
  paymentMethod: string;
  notes?: string;
}

interface BillReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillDetails | null;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  isOpen,
  onClose,
  bill
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const printableRef = useRef<HTMLDivElement | null>(null);

  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invoice' | 'canvas'>('invoice');

  const phoneInfo = bill ? formatPhoneNumber(bill.botId) : { formatted: '', waNumber: '', category: '' };
  const formattedDate = bill ? formatReadableDate(bill.purchaseDate) : '';
  const formattedExpiry = bill ? formatReadableDate(bill.expiryDate) : '';
  const transactionId = bill ? `GXMD-${bill.invoiceNo.replace(/\D/g, '').slice(-6) || '849201'}` : '';

  // Render high-resolution geometric invoice onto HTML5 canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bill) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 850 x 1200 px (Crisp high-definition 2:3 invoice proportion)
    const width = 850;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    // 1. Clean White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 2. Top-Left & Top Geometric Polygons (Matching reference images)
    // Dark Navy Main Header Block
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, 130);
    ctx.lineTo(0, 240);
    ctx.closePath();
    ctx.fillStyle = '#0a1e3f';
    ctx.fill();

    // Vibrant Orange / Gold Sharp Angle Accent Polygon
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(180, 0);
    ctx.lineTo(70, 150);
    ctx.lineTo(0, 130);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Secondary Gold Stripe Angle
    ctx.beginPath();
    ctx.moveTo(width - 220, 130);
    ctx.lineTo(width, 85);
    ctx.lineTo(width, 115);
    ctx.lineTo(width - 190, 155);
    ctx.closePath();
    ctx.fillStyle = '#ea580c';
    ctx.fill();

    // 3. Brand Identity in Top-Left (Inside Navy Header)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('GHOST X MD', 205, 60);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText('OFFICIAL LICENSED BOT 🖤⚡', 205, 88);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Premium Access Control & License System', 205, 112);

    // 4. Large Display Title: "PAYMENT INVOICE"
    ctx.fillStyle = '#0a1e3f';
    ctx.font = '900 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PAYMENT INVOICE', 60, 305);

    // Receipt No & Date
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Receipt No:', 60, 345);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillText(bill.invoiceNo, 60, 370);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Date:', 280, 345);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(formattedDate, 280, 370);

    // Horizontal divider
    ctx.strokeStyle = '#0a1e3f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 400);
    ctx.lineTo(width - 60, 400);
    ctx.stroke();

    // 5. Billed To & Payment Summary (Two Column Boxes)
    const infoY = 440;

    // Left Column: Billed To Box
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(60, infoY, 340, 110, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a1e3f';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Billed To:', 80, infoY + 28);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Subscriber Bot Number:', 80, infoY + 52);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(phoneInfo.formatted, 80, infoY + 78);

    ctx.fillStyle = '#0284c7';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(phoneInfo.category === 'SL_Mobile' ? 'Sri Lanka WhatsApp Bot' : 'International Bot ID', 80, infoY + 98);

    // Right Column: Payment Summary Box
    const rightColX = 450;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(rightColX, infoY, 340, 110, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a1e3f';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Payment Summary:', rightColX + 20, infoY + 28);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Total Paid:', rightColX + 20, infoY + 52);
    ctx.fillStyle = '#0a1e3f';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(bill.price, rightColX + 130, infoY + 52);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Payment Method:', rightColX + 20, infoY + 74);
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(bill.paymentMethod, rightColX + 130, infoY + 74);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Transaction ID:', rightColX + 20, infoY + 96);
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(transactionId, rightColX + 130, infoY + 96);

    // 6. Itemized Table
    const tableY = 575;
    const tableW = width - 120;

    // Dark Navy Table Header
    ctx.fillStyle = '#0a1e3f';
    ctx.fillRect(60, tableY, tableW, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Description', 80, tableY + 25);
    ctx.fillText('Service Plan', 360, tableY + 25);
    ctx.fillText('Duration', 530, tableY + 25);
    ctx.textAlign = 'right';
    ctx.fillText('Amount', width - 80, tableY + 25);
    ctx.textAlign = 'left';

    // Table Content Row
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(60, tableY + 40, tableW, 55);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, tableY + 40, tableW, 55);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Ghost X MD Bot Access License', 80, tableY + 73);

    ctx.fillStyle = '#475569';
    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Ghost X MD Pro', 360, tableY + 73);
    ctx.fillText(bill.durationLabel, 530, tableY + 73);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0a1e3f';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(bill.price, width - 80, tableY + 73);
    ctx.textAlign = 'left';

    // Total Calculation Row
    const totalY = tableY + 110;
    ctx.fillStyle = '#0a1e3f';
    ctx.fillRect(width - 320, totalY, 260, 45);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TOTAL PAID', width - 300, totalY + 28);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(bill.price, width - 75, totalY + 30);
    ctx.textAlign = 'left';

    // 7. GHOST X MD IMPORTANT NOTICE BOX (User Requested Content in English)
    const noticeY = totalY + 70;
    ctx.fillStyle = '#fffbeb';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(60, noticeY, tableW, 165, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('📢 IMPORTANT GHOST X MD NOTICE FOR USERS:', 80, noticeY + 32);

    ctx.fillStyle = '#1e293b';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('• If the bot turns OFF for any reason, DO NOT remove the Linked Device ❌', 80, noticeY + 62);
    ctx.fillText('• The Linked Device is strictly required when bringing your bot back online ✅', 80, noticeY + 88);
    ctx.fillText('• Renew, Buy & Support Admin: +94 70 383 0990 (Message on WhatsApp) 💬', 80, noticeY + 114);

    ctx.fillStyle = '#b45309';
    ctx.font = 'italic 700 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('> Keep your bot Safe & Stable — Ghost X MD 🖤⚡', 80, noticeY + 142);

    // 8. Bottom Section: Thank you & Authorized Signature
    const bottomY = noticeY + 195;

    // Thank You
    ctx.fillStyle = '#0a1e3f';
    ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Thank You for', 60, bottomY + 25);
    ctx.fillText('Your Payment!', 60, bottomY + 54);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Licensed access active until: ' + formattedExpiry, 60, bottomY + 80);

    // Authorized By / Signature (Right Column)
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Authorized By:', width - 260, bottomY + 10);

    // Handwritten Signature Line
    ctx.strokeStyle = '#0a1e3f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(width - 250, bottomY + 40);
    ctx.bezierCurveTo(width - 210, bottomY + 20, width - 170, bottomY + 60, width - 120, bottomY + 30);
    ctx.bezierCurveTo(width - 100, bottomY + 15, width - 80, bottomY + 45, width - 60, bottomY + 35);
    ctx.stroke();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - 260, bottomY + 60);
    ctx.lineTo(width - 60, bottomY + 60);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Ghost X MD Team', width - 260, bottomY + 80);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Lead Bot Administrator', width - 260, bottomY + 98);

    // 9. Bottom-Right Angular Geometry (Matching reference images)
    ctx.beginPath();
    ctx.moveTo(width - 150, height);
    ctx.lineTo(width, height - 90);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = '#0a1e3f';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width - 210, height);
    ctx.lineTo(width - 100, height - 60);
    ctx.lineTo(width - 60, height);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // 10. Contact Footer Bar
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText(`Official Admin Support & Renew: +94 70 383 0990  •  Ghost X MD 🖤⚡`, 60, height - 25);
  }, [bill, phoneInfo, formattedDate, formattedExpiry, transactionId]);

  useEffect(() => {
    if (isOpen && bill) {
      // Delay slightly so DOM element is mounted
      setTimeout(drawCanvas, 50);
    }
  }, [isOpen, bill, drawCanvas]);

  if (!isOpen || !bill) return null;

  // WhatsApp share message with English Ghost X MD User Notice
  const origin = window.location.origin;
  const clientUrl = `${origin}?portal=${encodeURIComponent(bill.botId)}`;
  const waNumber = phoneInfo.waNumber;

  const shareMessage = 
`🖤 *GHOST X MD — PAYMENT INVOICE* ⚡
━━━━━━━━━━━━━━━━━━━━
🧾 *Invoice No:* ${bill.invoiceNo}
📅 *Date:* ${formattedDate}
📱 *Billed To:* ${phoneInfo.formatted}
⏱️ *Duration:* ${bill.durationLabel}
⏳ *Expiry Date:* ${formattedExpiry}
💳 *Payment Method:* ${bill.paymentMethod}
💰 *Total Paid:* ${bill.price}
🆔 *Transaction ID:* ${transactionId}
━━━━━━━━━━━━━━━━━━━━
📢 *GHOST X MD NOTICE FOR USERS:*
⚠️ *If the bot turns OFF for any reason, DO NOT remove the Linked Device* ❌
✅ *The Linked Device is strictly required to bring the bot back online*
💬 *If you need to change your phone number or face any issues, please message us*
> *Keep your bot Safe & Stable — Ghost X MD 🖤⚡*
━━━━━━━━━━━━━━━━━━━━
📞 *RENEW, BUY & SUPPORT ADMIN:*
*+94 70 383 0990* (https://wa.me/94703830990)
━━━━━━━━━━━━━━━━━━━━
🔗 *Access Pass:* ${clientUrl}
_Thank you for your payment!_`;

  const waShareUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(shareMessage)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // ROBUST DOWNLOAD FOR MOBILE & DESKTOP (Fixes "Bill eka dl venne na")
  const handleDownloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas not found, redrawing...');
      drawCanvas();
      return;
    }

    setDownloading(true);

    try {
      // Step 1: Ensure canvas is drawn
      drawCanvas();

      // Step 2: Try modern HTML5 Blob download
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            const fileName = `GhostXMD_Invoice_${bill.botId}_${bill.invoiceNo}.png`;

            // Test if mobile Web Share API can share the image directly
            if (navigator.share && navigator.canShare) {
              const file = new File([blob], fileName, { type: 'image/png' });
              if (navigator.canShare({ files: [file] })) {
                navigator.share({
                  files: [file],
                  title: 'Ghost X MD Payment Invoice',
                  text: `Invoice for ${phoneInfo.formatted}`
                }).catch(() => {
                  // Fallback to direct anchor download
                  triggerAnchorDownload(blobUrl, fileName);
                });
                setDownloading(false);
                setDownloadSuccess(true);
                setTimeout(() => setDownloadSuccess(false), 3000);
                return;
              }
            }

            triggerAnchorDownload(blobUrl, fileName);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            setDownloading(false);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
          } else {
            fallbackDataUrlDownload();
          }
        }, 'image/png', 1.0);
      } else {
        fallbackDataUrlDownload();
      }
    } catch (e) {
      console.error('Failed to download image:', e);
      fallbackDataUrlDownload();
    }
  };

  const triggerAnchorDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fallbackDataUrlDownload = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      triggerAnchorDownload(dataUrl, `GhostXMD_Invoice_${bill.botId}_${bill.invoiceNo}.png`);
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Data URL fallback failed', err);
      setDownloading(false);
      // If automatic download is blocked by Chrome sandbox, open in preview modal so user can tap & hold save
      if (canvasRef.current) {
        setPreviewImageModalUrl(canvasRef.current.toDataURL('image/png'));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-xl max-h-[96vh] shadow-2xl flex flex-col overflow-hidden text-slate-800 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Modal Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-[#0a1e3f] text-amber-400 font-bold shadow-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                <span>Ghost X MD Payment Invoice</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold shrink-0">
                  Verified
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
                {bill.invoiceNo} • {phoneInfo.formatted}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[10px] sm:text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('invoice')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  activeTab === 'invoice' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('canvas');
                  drawCanvas();
                }}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  activeTab === 'canvas' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Canvas
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Bill Content */}
        <div className="p-2 sm:p-4 overflow-y-auto bg-slate-100/60 flex items-center justify-center min-h-[300px]">
          
          {/* ALWAYS MOUNTED CANVAS (Hidden when on visual tab so download never fails!) */}
          <canvas
            ref={canvasRef}
            className={activeTab === 'canvas' ? 'w-full h-auto max-h-[62vh] object-contain rounded-xl shadow-md border border-slate-200 bg-white' : 'hidden'}
          />

          {/* VISUAL HIGH-FIDELITY INVOICE (Matching reference images) */}
          {activeTab === 'invoice' && (
            <div
              ref={printableRef}
              className="w-full bg-white shadow-lg rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden relative text-slate-900 select-text max-w-lg"
            >
              {/* Geometric Diagonal Top Banners */}
              <div className="relative h-24 sm:h-28 bg-[#0a1e3f] overflow-hidden flex items-center px-4 sm:px-6 text-white">
                {/* Diagonal Orange Wedge Accent */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-20 sm:w-28 bg-amber-500"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 45% 100%, 0 100%)' }}
                />
                <div
                  className="absolute right-0 bottom-0 w-24 sm:w-32 h-8 bg-amber-500/80"
                  style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }}
                />

                <div className="relative z-10 pl-14 sm:pl-16 min-w-0">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1">
                    GHOST X MD <span className="text-amber-400 text-sm sm:text-base">🖤⚡</span>
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-amber-300 font-mono font-semibold truncate">
                    OFFICIAL LICENSED BOT SERVICE
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-blue-200 truncate">
                    Premium Subscription & Payment Guarantee
                  </p>
                </div>
              </div>

              {/* Main Invoice Body */}
              <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 text-xs">
                {/* Header Title & Invoice Meta */}
                <div className="flex items-end justify-between gap-2 border-b-2 border-slate-900 pb-2.5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#0a1e3f] tracking-tight">
                      PAYMENT INVOICE
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                      Ghost X MD License
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-right">
                    <div>
                      <span className="font-bold text-slate-500 block uppercase text-[9px] sm:text-[10px]">Receipt:</span>
                      <strong className="font-mono text-slate-900">{bill.invoiceNo}</strong>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block uppercase text-[9px] sm:text-[10px]">Date:</span>
                      <strong className="text-slate-900">{formattedDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Billed To & Payment Summary Cards (Crisp Fixed Boxes) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Billed To Box */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <h4 className="font-bold text-xs text-[#0a1e3f]">Billed To:</h4>
                    <p className="text-[10px] text-slate-500">Subscriber Phone:</p>
                    <p className="font-mono text-sm sm:text-base font-bold text-slate-950 truncate">{phoneInfo.formatted}</p>
                    <p className="text-blue-600 font-medium text-[10px] truncate">
                      {phoneInfo.category === 'SL_Mobile' ? 'Sri Lanka WhatsApp Bot' : 'International Bot ID'}
                    </p>
                  </div>

                  {/* Payment Summary Box */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <h4 className="font-bold text-xs text-[#0a1e3f]">Payment Summary:</h4>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Total Paid:</span>
                      <strong className="text-slate-950 font-mono font-bold text-xs">{bill.price}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Method:</span>
                      <strong className="text-slate-900">{bill.paymentMethod}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>Trx ID:</span>
                      <strong className="text-slate-900 font-mono">{transactionId}</strong>
                    </div>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-[11px] sm:text-xs">
                    <thead className="bg-[#0a1e3f] text-white font-bold">
                      <tr>
                        <th className="p-2 sm:p-2.5">Description</th>
                        <th className="p-2 sm:p-2.5">Duration</th>
                        <th className="p-2 sm:p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      <tr>
                        <td className="p-2 sm:p-2.5">
                          <p className="font-bold text-slate-900">Ghost X MD Bot License</p>
                          <p className="text-[10px] text-slate-500">Premium active runtime commands</p>
                        </td>
                        <td className="p-2 sm:p-2.5 text-slate-900 font-semibold">{bill.durationLabel}</td>
                        <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-slate-950">{bill.price}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Total Amount Bar */}
                  <div className="bg-[#0a1e3f] text-white p-2 sm:p-2.5 flex justify-between items-center text-xs font-bold">
                    <span>TOTAL AMOUNT PAID</span>
                    <span className="text-amber-400 font-mono text-sm sm:text-base">{bill.price}</span>
                  </div>
                </div>

                {/* 📢 GHOST X MD IMPORTANT USER NOTICE (User Requested Content in English) */}
                <div className="rounded-xl border-2 border-amber-400 bg-amber-50/80 p-3 sm:p-3.5 space-y-1.5 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 text-amber-950 font-bold text-[11px] sm:text-xs uppercase tracking-wide">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Important Ghost X MD Notice for Users:</span>
                  </div>

                  <ul className="space-y-1 text-slate-800 text-[10px] sm:text-[11px] leading-relaxed font-medium">
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-600 shrink-0 font-bold">⚠️</span>
                      <span><strong>If the bot turns OFF for any reason, DO NOT remove the Linked Device ❌</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 shrink-0 font-bold">✅</span>
                      <span><strong>The Linked Device is strictly required when bringing your bot back online.</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 shrink-0 font-bold">📞</span>
                      <span>
                        <strong>Renew, Buy &amp; Support Admin:</strong>{' '}
                        <a 
                          href="https://wa.me/94703830990?text=Hello%20Ghost%20X%20MD%20Admin,%20I%20want%20to%20renew%20or%20buy%20bot"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline font-bold font-mono"
                        >
                          +94 70 383 0990
                        </a>
                      </span>
                    </li>
                  </ul>

                  <p className="text-amber-950 font-bold italic text-[10px] sm:text-[11px] pt-0.5">
                    &gt; Keep your bot Safe &amp; Stable — <strong>Ghost X MD 🖤⚡</strong>
                  </p>
                </div>

                {/* Bottom Signature & Thank You Grid */}
                <div className="flex items-end justify-between gap-3 pt-1 border-t border-slate-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#0a1e3f] leading-tight">
                      Thank You for<br />Your Payment!
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Valid until: <strong className="text-slate-800">{formattedExpiry}</strong>
                    </p>
                  </div>

                  {/* Authorized Signature */}
                  <div className="text-right space-y-0.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase block">Authorized By:</span>
                    <div className="py-0.5">
                      <svg className="w-28 sm:w-32 h-7 sm:h-8 inline-block text-[#0a1e3f]" viewBox="0 0 160 45" fill="none" stroke="currentColor">
                        <path d="M10,30 Q35,5 60,35 T110,20 T150,28" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="5" y1="40" x2="155" y2="40" stroke="#94a3b8" strokeWidth="1" />
                      </svg>
                    </div>
                    <p className="font-bold text-[11px] text-slate-900">Ghost X MD Administration</p>
                  </div>
                </div>

                {/* Bottom Geometric Corner Accent */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                  <span>Ghost X MD 🖤⚡</span>
                  <a href="https://wa.me/94703830990" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">
                    Admin: +94 70 383 0990
                  </a>
                  <span>Verified License</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions (Fully Mobile-Responsive, No Overflow) */}
        <div className="p-3 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Includes Ghost X MD User Notice</span>
          </div>

          <div className="flex items-center gap-1.5 justify-end flex-wrap">
            {/* Copy Text */}
            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer shrink-0"
              title="Copy receipt text with notice"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex px-2.5 py-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition items-center gap-1 cursor-pointer shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Send on WhatsApp */}
            <a
              href={waShareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            {/* Download Image Bill (Fixed!) */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#0a1e3f] hover:bg-[#122c5a] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Bill</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Fallback Full-Screen Image Preview Modal for long-press saving if browser blocks download */}
      {previewImageModalUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 p-4 flex flex-col items-center justify-center animate-in fade-in"
          onClick={() => setPreviewImageModalUrl(null)}
        >
          <div className="bg-white rounded-2xl p-3 max-w-md w-full text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900">Image Ready (Tap & Hold to Save)</h4>
              <button onClick={() => setPreviewImageModalUrl(null)} className="p-1 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img 
              src={previewImageModalUrl} 
              alt="Ghost X MD Bill" 
              className="w-full h-auto max-h-[70vh] object-contain rounded-xl border border-slate-200"
            />
            <p className="text-xs text-slate-500">
              Long-press on the image above to save to your photos or gallery.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
