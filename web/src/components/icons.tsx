import type { ReactNode } from "react";

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const wrap = (children: ReactNode, extra: object = {}) => <svg {...base} {...extra} aria-hidden="true">{children}</svg>;

export const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 001.5.86l12-7.5a1 1 0 000-1.72l-12-7.5A1 1 0 007 4.5z" /></svg>
);
export const BellIcon = () => wrap(<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0" />);
export const PlusIcon = () => wrap(<path d="M12 5v14M5 12h14" />, { strokeWidth: 2.4 });
export const CheckIcon = () => wrap(<path d="M5 12.5l4.5 4.5L19 7" />, { strokeWidth: 2.4 });
export const ShareIcon = () => wrap(<path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" />);
export const FlagIcon = () => wrap(<path d="M5 21V4M5 4h11l-2 4 2 4H5" />);
export const UserIcon = () => wrap(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></>);
export const LeftIcon = () => wrap(<path d="M15 5l-7 7 7 7" />, { strokeWidth: 2.4 });
export const RightIcon = () => wrap(<path d="M9 5l7 7-7 7" />, { strokeWidth: 2.4 });
export const InfoIcon = () => wrap(<><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></>);
export const SearchIcon = () => wrap(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>);
export const MoonIcon = () => wrap(<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />);
export const HomeIcon = () => wrap(<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />);
export const TvIcon = () => wrap(<><rect x="3" y="5" width="18" height="13" rx="2" /><path d="M8 21h8" /></>);
export const BookmarkIcon = () => wrap(<path d="M6 3h12v18l-6-4-6 4z" />);
