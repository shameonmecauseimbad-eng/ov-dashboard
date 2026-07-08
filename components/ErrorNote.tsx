/** Dezente Fehler-/Hinweismeldung innerhalb eines Widgets — kein Absturz, kein Alarmrot. */
export default function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="animate-error-in rounded-lg border border-line bg-white/[0.03] px-3.5 py-3 text-xs leading-relaxed text-muted motion-reduce:animate-none">
      {children}
    </p>
  );
}
