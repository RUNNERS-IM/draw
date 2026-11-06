import type { Callback } from '../types';
import './ZoomLayer.scss';

import { useCallback, useEffect, useRef, useState } from 'react';
import { zoomLevels } from '../constants';

const maxZoomIndex = zoomLevels.length - 1;
const minZoomIndex = 0;

const ZoomLayer = ({
  imageDataUrl,
  currentFocusPoint,
  resumeFocusPoint,
  currentZoomIndex,
  animateEntry,
  isResuming,
  isExiting,
  onExitZoom,
  onStartExitZoom,
  onLockZoom,
  onResumeZoomEnd,
}: { imageDataUrl: string; currentFocusPoint: { x: number; y: number }; resumeFocusPoint: { x: number; y: number }; currentZoomIndex: number; animateEntry: boolean; isResuming: boolean; isExiting: boolean; onExitZoom: Callback; onStartExitZoom: Callback; onLockZoom: Callback; onResumeZoomEnd: Callback }) => {
  const [zoomIndex, setZoomIndex] = useState(currentZoomIndex);
  const [focusPoint, setFocusPoint] = useState(resumeFocusPoint || currentFocusPoint);

  const lastWheelAtRef = useRef(0);

  const zoomIn = useCallback(() => {
    if (zoomIndex === maxZoomIndex) return;

    setZoomIndex((currentIndex: number) => Math.min(currentIndex + 1, maxZoomIndex));
  }, [zoomIndex]);

  const zoomOut = useCallback(() => {
    if (zoomIndex === minZoomIndex) return;

    setZoomIndex((currentIndex: number) => Math.max(currentIndex - 1, minZoomIndex));
  }, [zoomIndex]);

  const handleKeyDown = useCallback((event: any) => {
    if (isExiting) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onStartExitZoom();
      return;
    }

    if (event.key === 'ArrowUp' || event.key === '+') {
      event.preventDefault();
      zoomIn();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === '-') {
      event.preventDefault();
      zoomOut();
      return;
    }
  }, [isExiting, onStartExitZoom, zoomIn, zoomOut]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handlePointerMove = (event: any) => {
    if (isExiting) return;

    setFocusPoint({ x: event.clientX, y: event.clientY });
  };

  const handleClick = () => {
    if (isExiting) return;
    if (isResuming) return;

    onLockZoom({
      zoomIndex: zoomIndex,
      focusPoint: {
        x: focusPoint.x,
        y: focusPoint.y,
      },
    });
  };

  const handleWheel = (event: any) => {
    event.preventDefault();

    if (isExiting) return;
    if (event.deltaY === 0) return;

    const now = Date.now();

    if (now - lastWheelAtRef.current < 100) return;
    lastWheelAtRef.current = now;

    if (event.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const handleContextMenu = (event: any) => {
    event.preventDefault();

    if (isExiting) return;

    onStartExitZoom();
  };

  const handleHintClick = (event: any) => {
    event.stopPropagation();

    onStartExitZoom();
  };

  const handleZoomTransitionEnd = () => {
    if (!isExiting) return;

    onExitZoom();
  };

  const handleResumeAnimationEnd = () => {
    onResumeZoomEnd();
  };

  const zoom = zoomLevels[zoomIndex];

  return (
    <div
      id="zoom_layer"
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    >
      <img
        className={`zoom_layer__image${isExiting ? ' zoom_layer__image--exiting' : ''}${isResuming ? ' zoom_layer__image--resuming' : ''}`}
        src={imageDataUrl}
        onTransitionEnd={handleZoomTransitionEnd}
        onAnimationEnd={handleResumeAnimationEnd}
        style={{
          '--target-zoom': isExiting ? 1 : zoom,
          '--starting-zoom': animateEntry ? 1 : zoom,
          '--starting-cursor-x': `${currentFocusPoint.x}px`,
          '--starting-cursor-y': `${currentFocusPoint.y}px`,
          '--cursor-x': `${focusPoint.x}px`,
          '--cursor-y': `${focusPoint.y}px`,
        }}
      />

      {!isExiting && (
        <div
          className="zoom_layer__hint"
          title="Scroll to zoom · Left-click to lock · Esc to exit"
          onClick={handleHintClick}
        >
          <div className="zoom_layer__hint-main">
            <div className="zoom_layer__hint-title">Zoom: {zoom}x</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoomLayer;
