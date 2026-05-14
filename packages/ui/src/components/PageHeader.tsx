interface PageHeaderProps {
  title: string;
  showDate?: boolean;
}

export function PageHeader({ title, showDate = true }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-medium text-[#fafafa]">{title}</h2>
      {showDate && (
        <p className="text-[#898989] text-sm">
          {new Date().toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
