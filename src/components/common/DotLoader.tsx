type Props = {
  count?: number;
  delay?: number;
  className?: string;
};

export default function DotLoader({
  count = 4,
  delay = 5,
  className = '',
}: Props) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`block rounded-full bg-current animate-dot-loader text-black size-1 ${className}`}
          style={{ animationDelay: `${i * delay * 0.05}s` }}
        />
      ))}
    </span>
  );
}
