"use client";

import { useState } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  toast
} from "@heroui/react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  BookingDto,
  acceptBookingCancellation,
  rejectBookingCancellation
} from "@/lib/api/bookings";
import { useI18n } from "@/context/LanguageContext";

interface CancelRequestActionsProps {
  booking: BookingDto;
  /** Called after a successful accept/reject so the host page can refetch and close. */
  onDone?: () => void | Promise<void>;
}

/**
 * Portal-side actions for a booking that is in `cancellation_requested` state.
 * Renders the accept/reject buttons (place inside the detail modal footer) plus
 * the confirmation modal. Returns null for any other status.
 */
export default function CancelRequestActions({ booking, onDone }: CancelRequestActionsProps) {
  const { t } = useI18n();
  const tb = t.adminBookings;
  const [confirmAction, setConfirmAction] = useState<"accept" | "reject" | null>(null);
  const [loading, setLoading] = useState(false);

  if (booking.bookingStatus !== "cancellation_requested") return null;

  const isAccept = confirmAction === "accept";

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      if (confirmAction === "accept") {
        await acceptBookingCancellation(booking.id);
        toast.success(tb.acceptCancelSuccess);
      } else {
        await rejectBookingCancellation(booking.id);
        toast.success(tb.rejectCancelSuccess);
      }
      setConfirmAction(null);
      await onDone?.();
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : tb.cancelActionFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setConfirmAction("reject")}
        className="rounded-xl font-bold text-xs h-10 px-4 border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-[var(--bg-card)] hover:bg-rose-100 dark:hover:bg-[var(--bg-elevated)] text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
      >
        <XCircle size={15} className="mr-1.5" />
        {tb.rejectCancel}
      </Button>
      <Button
        onClick={() => setConfirmAction("accept")}
        className="rounded-xl font-bold text-xs h-10 px-4 bg-rose-500 hover:bg-rose-600 text-white shadow-sm cursor-pointer border-none transition-colors"
      >
        <CheckCircle2 size={15} className="mr-1.5" />
        {tb.acceptCancel}
      </Button>

      <Modal
        isOpen={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !loading) setConfirmAction(null);
        }}
      >
        <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
          <ModalContainer>
            <ModalDialog className="max-w-md flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
                <AlertTriangle size={18} className={isAccept ? "text-rose-500" : "text-amber-500"} />
                <span className="text-base font-bold text-foreground">
                  {isAccept ? tb.confirmAcceptCancelTitle : tb.confirmRejectCancelTitle}
                </span>
              </ModalHeader>
              <ModalBody className="p-6">
                <p className="text-sm text-foreground/70">
                  {(isAccept ? tb.confirmAcceptCancelMessage : tb.confirmRejectCancelMessage).replace(
                    "{code}",
                    booking.bookingCode
                  )}
                </p>
              </ModalBody>
              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  isDisabled={loading}
                  onClick={() => setConfirmAction(null)}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {tb.cancel}
                </Button>
                <Button
                  isDisabled={loading}
                  onClick={handleConfirm}
                  className={`rounded-xl font-bold text-xs h-10 px-5 ${
                    isAccept ? "bg-rose-500 hover:bg-rose-600" : "bg-amber-500 hover:bg-amber-600"
                  } text-white shadow-sm cursor-pointer border-none transition-colors`}
                >
                  {isAccept ? <CheckCircle2 size={15} className="mr-1.5" /> : <XCircle size={15} className="mr-1.5" />}
                  {isAccept ? tb.acceptCancel : tb.rejectCancel}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    </>
  );
}