export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-gray-400">{subtitle}</p>}
    </div>
  );
}
