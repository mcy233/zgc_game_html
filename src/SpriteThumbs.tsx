import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Package, Users } from 'lucide-react';
import {
  ASSET_ATLAS_CONFIG,
  ASSET_ATLAS_ORDER,
  AVATAR_ATLAS_CONFIG,
  AVATAR_ATLAS_ORDER,
} from './constants';
import { assetUrl } from './assetUrl';
import type { AdvisorType, LabMate } from './types';
import { spriteStyleUniformGridPx } from './spriteAtlas';

function useRemoteImageReady(url: string): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    setOk(null);
    const im = new Image();
    im.onload = () => setOk(true);
    im.onerror = () => setOk(false);
    im.src = url;
  }, [url]);
  return ok;
}

function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [dims, setDims] = useState({ w: 96, h: 96 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setDims({ w: Math.max(r.width, 1), h: Math.max(r.height, 1) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ...dims };
}

function AtlasSpriteSlice({
  src,
  pixelWidth,
  pixelHeight,
  cols,
  rows,
  index,
  className = '',
}: {
  src: string;
  pixelWidth: number;
  pixelHeight: number;
  cols: number;
  rows: number;
  index: number;
  className?: string;
}) {
  const { ref, w, h } = useContainerSize<HTMLDivElement>();
  const style = useMemo(
    () =>
      spriteStyleUniformGridPx(pixelWidth, pixelHeight, cols, rows, index, w, h, src),
    [src, pixelWidth, pixelHeight, cols, rows, index, w, h]
  );

  return (
    <div ref={ref} className={`w-full h-full min-h-[2rem] overflow-hidden ${className}`}>
      <div className="w-full h-full" style={style} role="presentation" />
    </div>
  );
}

/** 资产图：优先雪碧图（像素定位），失败则单文件 `/assets/{id}.png`，再失败为 Package */
export function AssetThumb({ assetId }: { assetId: string }) {
  const atlasReady = useRemoteImageReady(ASSET_ATLAS_CONFIG.src);
  const index = (ASSET_ATLAS_ORDER as readonly string[]).indexOf(assetId);
  const [fileBroken, setFileBroken] = useState(false);

  if (atlasReady === null) {
    return <div className="w-full h-full min-h-[2rem] animate-pulse bg-black/10 rounded-lg" aria-hidden />;
  }

  if (atlasReady && index >= 0) {
    return (
      <AtlasSpriteSlice
        src={ASSET_ATLAS_CONFIG.src}
        pixelWidth={ASSET_ATLAS_CONFIG.pixelWidth}
        pixelHeight={ASSET_ATLAS_CONFIG.pixelHeight}
        cols={ASSET_ATLAS_CONFIG.cols}
        rows={ASSET_ATLAS_CONFIG.rows}
        index={index}
      />
    );
  }

  if (fileBroken) {
    return <Package size={36} className="text-gray-400" aria-hidden />;
  }

  return (
    <img
      src={assetUrl(`assets/${assetId}.png`)}
      alt=""
      className="w-full h-full object-cover"
      onError={() => setFileBroken(true)}
    />
  );
}

export function advisorAvatarKey(type: AdvisorType): string {
  return `advisor_${type}`;
}

export function labAvatarKey(role: LabMate['role']): string {
  return role;
}

type AvatarThumbProps = {
  spriteKey: string;
  className?: string;
  frameClassName?: string;
};

/**
 * 头像雪碧图：4×3，键顺序见 AVATAR_ATLAS_ORDER。
 */
export function AvatarThumb({ spriteKey, className = '', frameClassName = 'w-12 h-12' }: AvatarThumbProps) {
  const atlasReady = useRemoteImageReady(AVATAR_ATLAS_CONFIG.src);
  const order = AVATAR_ATLAS_ORDER as readonly string[];
  const index = order.indexOf(spriteKey);

  if (atlasReady === null) {
    return (
      <div
        className={`${frameClassName} shrink-0 rounded-full bg-black/10 animate-pulse ${className}`}
        aria-hidden
      />
    );
  }

  if (atlasReady && index >= 0) {
    return (
      <div
        className={`${frameClassName} shrink-0 rounded-full overflow-hidden border border-black/10 bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}
        role="img"
        aria-hidden
      >
        <AtlasSpriteSlice
          src={AVATAR_ATLAS_CONFIG.src}
          pixelWidth={AVATAR_ATLAS_CONFIG.pixelWidth}
          pixelHeight={AVATAR_ATLAS_CONFIG.pixelHeight}
          cols={AVATAR_ATLAS_CONFIG.cols}
          rows={AVATAR_ATLAS_CONFIG.rows}
          index={index}
        />
      </div>
    );
  }

  return (
    <div
      className={`${frameClassName} shrink-0 rounded-full bg-black/5 flex items-center justify-center border border-black/10 ${className}`}
      aria-hidden
    >
      <Users className="w-1/2 h-1/2 text-black/25" strokeWidth={1.5} />
    </div>
  );
}
