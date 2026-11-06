import './ZoomBackground.scss';

import React from 'react';
import { zoomLevels } from '../constants';

const ZoomBackground = ({
  imageDataUrl,
  currentFocusPoint,
  currentZoomIndex,
  onStartExitZoom,
}) => {
  const zoom = zoomLevels[currentZoomIndex];

  const handleHintClick = (event) => {
    event.stopPropagation();

    onStartExitZoom();
  };

  return (
    <div id="zoom_background">
      <img
        className="zoom_background__image"
        src={imageDataUrl}
        style={{
          '--background-zoom': zoom,
          '--cursor-x': `${currentFocusPoint.x}px`,
          '--cursor-y': `${currentFocusPoint.y}px`,
        }}
      />

      <div
        className="zoom_background__hint"
        title="Right-click to resume · Esc to exit"
        onClick={handleHintClick}
      >
        <div className="zoom_background__hint-main">
          <div className="zoom_background__hint-title">Zoom: Draw</div>
        </div>
      </div>
    </div>
  );
};

export default ZoomBackground;
