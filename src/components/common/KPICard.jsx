function KPICard({ data }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      
      <p className="text-sm text-[var(--muted)]">
        {data.title}
      </p>

      <h2 className="text-2xl font-semibold mt-2">
        {data.value}
      </h2>

    </div>
  );
}

export default KPICard;