"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, MessageSquare } from "lucide-react";
import { Button, Skeleton, Input, TextArea, Label, TextField, FieldError } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";
import { useAuthStore } from "@/lib/store/authStore";
import { AutofillButton } from "@/components/AutofillButton";
import BookingConfirmationModal from "@/components/BookingConfirmationModal";
import SuccessOverlay from "@/components/SuccessOverlay";
import ErrorOverlay from "@/components/ErrorOverlay";
import { createAirportTransferBooking } from "@/lib/api/airport-transfer/bookings";
import { loadBookingDraft, saveBookingDraft, clearBookingDraft, type BookingDraft } from "@/lib/airport-transfer-draft";
import { formatPriceSync as _formatPrice } from "@/lib/format";

export default function AirportTransferCheckoutPage() {
  const router = useRouter();
  const { language, t } = useI18n();

  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zaloId, setZaloId] = useState("");
  const [kakaoTalkId, setKakaoTalkId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) => setErrors(prev => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const formatPrice = (value: number) => _formatPrice(value, language);

  useEffect(() => {
    const d = loadBookingDraft();
    if (!d) {
      router.replace(`/${language}/airport-transfer`);
      return;
    }
    setDraft(d);
    setName(d.contact.fullName);
    setPhone(d.contact.phone);
    setEmail(d.contact.email);
    setZaloId(d.contact.zaloId);
    setKakaoTalkId(d.contact.kakaoTalkId);
    setWhatsapp(d.contact.whatsapp);
    setNotes(d.contact.notes);

    const { user, isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated && user) {
      if (!d.contact.fullName) setName(user.fullname ?? "");
      if (!d.contact.phone) setPhone(user.phone ?? "");
      if (!d.contact.email) setEmail(user.email ?? "");
      if (!d.contact.zaloId) setZaloId(user.zaloId ?? "");
      if (!d.contact.kakaoTalkId) setKakaoTalkId(user.kakaoTalkId ?? "");
      if (!d.contact.whatsapp) setWhatsapp(user.whatsapp ?? "");
    }
    setLoading(false);
  }, [language, router]);

  const persistContact = (patch: Partial<{ fullName: string; phone: string; email: string; zaloId: string; kakaoTalkId: string; whatsapp: string; notes: string }>) => {
    const current = loadBookingDraft();
    if (!current) return;
    saveBookingDraft({ ...current, contact: { ...current.contact, ...patch } });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name?.trim()) newErrors.name = t.errors.nameRequired;
    if (!phone?.trim()) newErrors.phone = t.errors.phoneRequired;
    if (!email?.trim()) newErrors.email = t.errors.emailRequired;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!draft || submitting) return;
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!draft || submitting) return;
    if (!validate()) { setShowConfirmModal(false); return; }

    setSubmitting(true);

    try {
      const res = await createAirportTransferBooking({
        ...draft.payload,
        customerName: name || "Guest",
        customerEmail: email || `${phone}@traveler.com`,
        customerPhone: phone,
        customerNotes: notes.trim() || undefined,
        zaloId: zaloId || undefined,
        kakaoTalkId: kakaoTalkId || undefined,
        whatsapp: whatsapp || undefined,
        contactChannel: zaloId ? "zalo" : kakaoTalkId ? "kakaotalk" : undefined,
        contactId: zaloId || kakaoTalkId || undefined,
      });

      if (res && res.data) {
        setCreatedCode(res.data.bookingCode || "BK-SUCCESS");
        clearBookingDraft();
        setBookingSuccess(true);
      } else {
        setErrorMessage(t.errors.bookingFailed);
      }
    } catch (err) {
      console.error("Booking API error:", err);
      setErrorMessage(err instanceof Error ? err.message : t.errors.bookingFailed);
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center gap-4 p-6">
        <Skeleton className="w-56 h-8 rounded-lg" />
        <Skeleton className="w-80 h-4 rounded-lg" />
        <Skeleton className="w-full max-w-md h-64 rounded-2xl" />
      </div>
    );
  }

  if (!draft) return null;

  if (bookingSuccess) {
    const onSuccessComplete = () => {
      router.push(`/${language}/airport-transfer/success?bookingCode=${createdCode}`);
    };
    return (
      <SuccessOverlay
        bookingCode={createdCode}
        onComplete={onSuccessComplete}
        title={t.airportTransfer.confirmSuccessTitle}
        subtitle={t.airportTransfer.redirecting}
      />
    );
  }

  const fieldInput = (className?: string) =>
    `w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-900 dark:text-white text-xs font-semibold outline-none focus:border-accent ${className || ""}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-50/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200 hover:border-accent transition-all cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent">
              {t.airportTransfer.checkoutStep}
            </span>
            <h1 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
              {t.airportTransfer.checkoutTitle}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 space-y-5">
        {/* Booking Summary */}
        <section className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.airportTransfer.summary}
          </h2>
          <div className="space-y-2.5">
            {draft.summaryItems.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-3 text-xs">
                <span className="font-bold text-slate-400 shrink-0">{item.label}:</span>
                <span className={`text-right font-semibold text-slate-800 dark:text-slate-100 ${item.highlight ? "text-accent" : ""}`}>
                  {item.value || "-"}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">{t.common.total}</span>
            <span className="text-lg font-black text-accent">{formatPrice(draft.totalAmount)}</span>
          </div>
        </section>

        {/* Customer Info */}
        <section className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.rentCar.contactInfo}
            </h2>
            <AutofillButton
              onFill={(d) => {
                setName(d.fullname);
                setPhone(d.phone);
                setEmail(d.email);
                setZaloId(d.zaloId ?? "");
                setKakaoTalkId(d.kakaoTalkId ?? "");
                setWhatsapp(d.whatsapp ?? "");
                persistContact({ fullName: d.fullname, phone: d.phone, email: d.email, zaloId: d.zaloId ?? "", kakaoTalkId: d.kakaoTalkId ?? "", whatsapp: d.whatsapp ?? "" });
                clearError("name");
                clearError("phone");
                clearError("email");
              }}
              label={t.common.autoFill}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User size={16} className="text-accent mt-2.5 shrink-0" />
              <TextField className="flex-1" isInvalid={!!errors.name}>
                <Label className="font-bold mb-1" isRequired>{t.airportTransfer.fullNameLabel}</Label>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError("name"); persistContact({ fullName: e.target.value }); }}
                  placeholder={t.airportTransfer.fullNamePlaceholder}
                  className={fieldInput()}
                />
                <FieldError>{errors.name}</FieldError>
              </TextField>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={16} className="text-accent mt-2.5 shrink-0" />
              <TextField className="flex-1" isInvalid={!!errors.phone}>
                <Label className="font-bold mb-1" isRequired>{t.airportTransfer.phoneLabel}</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearError("phone"); persistContact({ phone: e.target.value }); }}
                  placeholder="0987654321"
                  className={fieldInput()}
                />
                <FieldError>{errors.phone}</FieldError>
              </TextField>
            </div>

            <div className="flex items-start gap-3 sm:col-span-2">
              <Mail size={16} className="text-accent mt-2.5 shrink-0" />
              <TextField className="flex-1" isInvalid={!!errors.email}>
                <Label className="font-bold mb-1" isRequired>{t.airportTransfer.emailLabel}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError("email"); persistContact({ email: e.target.value }); }}
                  placeholder="email@example.com"
                  className={fieldInput()}
                />
                <FieldError>{errors.email}</FieldError>
              </TextField>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MessageSquare size={16} className="text-accent mt-2.5 shrink-0" />
              <div className="flex-1">
                <Label className="font-bold mb-1">{t.rentCar.zaloId}</Label>
                <Input
                  value={zaloId}
                  onChange={(e) => { setZaloId(e.target.value); persistContact({ zaloId: e.target.value }); }}
                  placeholder="Zalo ID"
                  className={fieldInput()}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare size={16} className="text-accent mt-2.5 shrink-0" />
              <div className="flex-1">
                <Label className="font-bold mb-1">{t.rentCar.kakaoTalkId}</Label>
                <Input
                  value={kakaoTalkId}
                  onChange={(e) => { setKakaoTalkId(e.target.value); persistContact({ kakaoTalkId: e.target.value }); }}
                  placeholder="KakaoTalk ID"
                  className={fieldInput()}
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare size={16} className="text-accent mt-2.5 shrink-0" />
              <div className="flex-1">
                <Label className="font-bold mb-1">{t.rentCar.whatsapp}</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => { setWhatsapp(e.target.value); persistContact({ whatsapp: e.target.value }); }}
                  placeholder="WhatsApp"
                  className={fieldInput()}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare size={16} className="text-accent mt-2.5 shrink-0" />
            <div className="flex-1">
              <Label className="font-bold mb-1">{t.airportTransfer.notesLabel}</Label>
              <TextArea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); persistContact({ notes: e.target.value }); }}
                placeholder={t.airportTransfer.notesPlaceholder}
                className={`w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-900 dark:text-white text-xs font-semibold outline-none focus:border-accent resize-none`}
                rows={2}
              />
            </div>
          </div>
        </section>

        <Button
          onClick={handleSubmit}
          isDisabled={!draft || submitting}
          className="w-full h-12 rounded-2xl font-black text-sm sm:text-base bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
        >
          {submitting ? t.airportTransfer.submittingRequest : t.airportTransfer.confirmBooking}
        </Button>
      </main>

      {errorMessage && <ErrorOverlay message={errorMessage} onClose={() => setErrorMessage("")} />}

      <BookingConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        summaryItems={draft.summaryItems}
        totalAmount={draft.totalAmount}
        totalLabel={t.common.total}
        submitting={submitting}
        contactInfo={{
          fullName: name,
          phone,
          email,
          zaloId: zaloId || undefined,
          kakaoTalkId: kakaoTalkId || undefined,
          whatsapp: whatsapp || undefined,
        }}
      />
    </div>
  );
}
