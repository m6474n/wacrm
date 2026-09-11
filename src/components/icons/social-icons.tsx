import React from "react";

export function InstagramIcon({ className = "h-4 w-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ className = "h-4 w-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-4 w-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  );
}

export function MetaIcon({ className = "h-4 w-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12.001 8.285c-1.85-2.584-4.512-3.885-7.05-3.885C2.217 4.4 0 6.643 0 11.758c0 4.298 1.956 7.842 5.093 7.842 2.67 0 4.673-1.879 6.908-5.076 2.235 3.197 4.238 5.076 6.908 5.076 3.137 0 5.091-3.544 5.091-7.842 0-5.115-2.217-7.358-4.951-7.358-2.538 0-5.2 1.301-7.048 3.885zm4.847 8.358c-1.838 0-3.323-1.636-5.01-4.232 2.005-3.076 3.65-4.854 5.01-4.854 1.761 0 2.951 1.579 2.951 4.543 0 2.964-1.19 4.543-2.951 4.543zm-9.694 0c-1.761 0-2.951-1.579-2.951-4.543 0-2.964 1.19-4.543 2.951-4.543 1.36 0 3.005 1.778 5.01 4.854-1.687 2.596-3.172 4.232-5.01 4.232z" />
    </svg>
  );
}
