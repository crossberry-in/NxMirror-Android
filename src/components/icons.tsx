import React from "react";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

/**
 * NxMirror icon set — lightweight react-native-svg glyphs drawn on a 24px grid,
 * styled by currentColor so they adapt to the Liquid Glass theme.
 */

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function Base({ size = 24, color = "#FFFFFF", strokeWidth = 1.8, children }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </G>
    </Svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M4 11.2 12 4.5l8 6.7" />
    <Path d="M6.2 10.4V19.5h11.6V10.4" />
    <Path d="M10 19.5v-4.6h4v4.6" />
  </Base>
);

export const PackageIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 3.2 20 7.4v9.2L12 20.8 4 16.6V7.4z" />
    <Path d="M12 12 4.2 7.6M12 12l7.8-4.4M12 12v8.6" />
  </Base>
);

export const FolderIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M3.6 6.8c0-.9.7-1.6 1.6-1.6h4.1l2 2.3h7.5c.9 0 1.6.7 1.6 1.6v8.3c0 .9-.7 1.6-1.6 1.6H5.2c-.9 0-1.6-.7-1.6-1.6z" />
  </Base>
);

export const GitIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="6.5" cy="6" r="2.1" />
    <Circle cx="6.5" cy="18" r="2.1" />
    <Circle cx="17.5" cy="8.5" r="2.1" />
    <Path d="M6.5 8.1v7.8" />
    <Path d="M15.5 9.8c-1.6 1.8-4 1.6-6.4 4.4" />
  </Base>
);

export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="8.4" r="3.4" />
    <Path d="M5 19.6c1.3-3 4-4.6 7-4.6s5.7 1.6 7 4.6" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="10.8" cy="10.8" r="5.6" />
    <Path d="M15.2 15.2 19.5 19.5" />
  </Base>
);

export const UploadIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 15.5V4.8" />
    <Path d="M8 8.4 12 4.6l4 3.8" />
    <Path d="M4.6 15.4v2.9c0 .9.7 1.6 1.6 1.6h11.6c.9 0 1.6-.7 1.6-1.6v-2.9" />
  </Base>
);

export const DownloadIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 4.5v10.7" />
    <Path d="M8 11.6 12 15.4l4-3.8" />
    <Path d="M4.6 15.4v2.9c0 .9.7 1.6 1.6 1.6h11.6c.9 0 1.6-.7 1.6-1.6v-2.9" />
  </Base>
);

export const CopyIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x="8.6" y="8.6" width="10.8" height="10.8" rx="2.4" />
    <Path d="M5.6 15.4h-.6a1.4 1.4 0 0 1-1.4-1.4V6.2a1.4 1.4 0 0 1 1.4-1.4h7.8a1.4 1.4 0 0 1 1.4 1.4v.6" />
  </Base>
);

export const CloseIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M9.4 6.4 15 12l-5.6 5.6" />
  </Base>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M14.6 6.4 9 12l5.6 5.6" />
  </Base>
);

export const SettingsIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M12 3.2v2.1M12 18.7v2.1M3.2 12h2.1M18.7 12h2.1M5.8 5.8l1.5 1.5M16.7 16.7l1.5 1.5M18.2 5.8l-1.5 1.5M7.3 16.7l-1.5 1.5" />
  </Base>
);

export const CloudIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M7 18.5a3.9 3.9 0 0 1-.6-7.8 5 5 0 0 1 9.6-1.6 3.7 3.7 0 0 1 1 7.2z" />
  </Base>
);

export const DatabaseIcon = (p: IconProps) => (
  <Base {...p}>
    <Ellipse cx="12" cy="6.2" rx="7" ry="2.7" />
    <Path d="M5 6.2v11.6c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7V6.2" />
    <Path d="M5 12c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7" />
  </Base>
);

export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Base {...p}>
    <Path
      d="M12 4.4l2.35 4.9 5.15.65-3.8 3.6 1 5.15L12 16.1l-4.7 2.6 1-5.15-3.8-3.6 5.15-.65z"
      fill={filled ? p.color || "#FFFFFF" : "none"}
      fillOpacity={0.85}
    />
  </Base>
);

export const PlusIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 5v14M5 12h14" />
  </Base>
);

export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M5.2 7h13.6M9.4 7V5.6c0-.7.6-1.3 1.3-1.3h2.6c.7 0 1.3.6 1.3 1.3V7" />
    <Path d="M7 7l.8 11.2c.1.9.8 1.5 1.6 1.5h5.2c.8 0 1.5-.6 1.6-1.5L17 7" />
    <Path d="M10.2 10.4v5.4M13.8 10.4v5.4" />
  </Base>
);

export const RefreshIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <Path d="M19.7 4.6v3.2h-3.2" />
  </Base>
);

export const LogoutIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M14.4 4.6H6.8c-.9 0-1.6.7-1.6 1.6v11.6c0 .9.7 1.6 1.6 1.6h7.6" />
    <Path d="M14 12h6.2M17.4 8.8 20.6 12l-3.2 3.2" />
  </Base>
);

export const EyeIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M2.8 12S6.2 6.4 12 6.4 21.2 12 21.2 12 17.8 17.6 12 17.6 2.8 12 2.8 12z" />
    <Circle cx="12" cy="12" r="2.6" />
  </Base>
);

export const ShieldIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 3.6 19 6v5.4c0 4.3-2.8 7.6-7 9-4.2-1.4-7-4.7-7-9V6z" />
    <Path d="M9.4 12.2l1.9 1.9 3.4-3.6" />
  </Base>
);

export const LayersIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 3.6 20 8l-8 4.4L4 8z" />
    <Path d="M4 12.4 12 16.8l8-4.4" />
    <Path d="M4 16.6 12 21l8-4.4" />
  </Base>
);

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="8" />
    <Path d="M12 7.6V12l3 1.9" />
  </Base>
);

export const LinkIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M9.5 14.5 14.5 9.5" />
    <Path d="M7.2 12.4 5.4 14.2a3.4 3.4 0 0 0 4.8 4.8l1.8-1.8M16.8 11.6l1.8-1.8a3.4 3.4 0 0 0-4.8-4.8L12 6.8" />
  </Base>
);

export const FileIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M6 5.4c0-.9.7-1.6 1.6-1.6H14L18 8v10.6c0 .9-.7 1.6-1.6 1.6H7.6c-.9 0-1.6-.7-1.6-1.6z" />
    <Path d="M13.8 3.8V8h4.2" />
  </Base>
);

export const PlayIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M8.4 5.8 18 12l-9.6 6.2z" />
  </Base>
);

export const WifiOffIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M4.4 9.6a12 12 0 0 1 4-2.5M19.6 9.6a12 12 0 0 0-8-3.5M8 13.2a7.2 7.2 0 0 1 2.6-1.5M16 13.2a7.2 7.2 0 0 0-3-1.6" />
    <Path d="M12 17.4v.1" strokeWidth={2.6} />
    <Path d="M4 4l16 16" />
  </Base>
);
