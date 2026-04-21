export const VelaLogo = ({
  size = 32,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="26" cy="26" r="22" stroke="currentColor" strokeWidth="1.2" />
    <line
      x1="13"
      y1="34"
      x2="22"
      y2="24"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <line
      x1="22"
      y1="24"
      x2="29"
      y2="29"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <line
      x1="29"
      y1="29"
      x2="40"
      y2="17"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <circle cx="40" cy="17" r="2.2" fill="currentColor" />
  </svg>
);
