import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import './FigureToolbar.scss';
import { MdRoundedCorner } from 'react-icons/md';
import MdSharpCorner from './icons/MdSharpCorner.js';
import { TbLineDashed, TbLineDotted, TbMinus } from 'react-icons/tb';
import { toolbarViewportMargin, widthList } from '../constants.js';
import { t } from '../../../../shared/i18n.js';

const strokeStyleFigureTypes = ['flat_arrow', 'rectangle', 'diamond', 'oval', 'line'];
const edgeStyleFigureTypes = ['rectangle', 'diamond'];

const clamp = (value, min, max) => {
  return Math.min(
    Math.max(value, min),
    Math.max(min, max),
  );
};

const getFigureBounds = (figure) => {
  if (figure.type === 'text') {
    const [x, y] = figure.points[0];

    return {
      left:   x,
      top:    y,
      right:  x + figure.width * figure.scale,
      bottom: y + figure.height * figure.scale,
    };
  }

  const { points: [pointA, pointB] } = figure;

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  return {
    left:   Math.min(startX, endX),
    top:    Math.min(startY, endY),
    right:  Math.max(startX, endX),
    bottom: Math.max(startY, endY),
  };
};

const FigureToolbar = ({
  figure,
  colorList,
  onChangeColor,
  onChangeWidth,
  onChangeStroke,
  onChangeEdges,
  onDelete,
  Icons,
}) => {
  const figureType        = figure.type;
  const figureColorIndex  = figure.colorIndex;
  const figureWidthIndex  = figure.widthIndex;
  const figureEdgeIndex   = figure.edgeIndex ?? 1;
  const figureStrokeIndex = figure.strokeIndex ?? 0;

  const figureHasEdgeStyle   = edgeStyleFigureTypes.includes(figureType);
  const figureHasStrokeStyle = strokeStyleFigureTypes.includes(figureType);

  const [openMenu, setOpenMenu] = useState(null);
  const [position, setPosition] = useState({ left: 0, top: 0, placement: 'bottom' });

  const toolbarRef = useRef(null);

  const updatePosition = useCallback(() => {
    const toolbarElement = toolbarRef.current;
    if (!toolbarElement) return;

    const figureGap = 16;
    const toolbarHeight = 36;
    const submenuHeight = 32; // 36 - 4 (overlap)

    const toolbarWidth = toolbarElement.offsetWidth;
    const figureBounds = getFigureBounds(figure);

    const topBoundary = toolbarViewportMargin;
    const bottomBoundary = window.innerHeight - toolbarViewportMargin;

    const topBelowFigure = figureBounds.bottom + figureGap;
    const topAboveFigure = figureBounds.top - figureGap - toolbarHeight;

    const canFitBelow = topBelowFigure + toolbarHeight + submenuHeight <= bottomBoundary;
    const canFitAbove = topAboveFigure - submenuHeight >= topBoundary;

    let placement;

    if (canFitBelow) {
      placement = 'bottom';
    } else if (canFitAbove) {
      placement = 'top';
    } else {
      placement = 'middle';
    }

    let preferredTop;
    let minTop;
    let maxTop;

    if (placement === 'bottom') {
      minTop = topBoundary;
      maxTop = bottomBoundary - toolbarHeight - submenuHeight;

      preferredTop = topBelowFigure;
    } else if (placement === 'top') {
      minTop = topBoundary + submenuHeight;
      maxTop = bottomBoundary - toolbarHeight;

      preferredTop = topAboveFigure;
    } else {
      preferredTop = figureBounds.bottom - figureGap - toolbarHeight;

      minTop = topBoundary;
      maxTop = bottomBoundary - toolbarHeight - submenuHeight;
    }

    const clampedTop = clamp(preferredTop, minTop, maxTop);

    const figureCenterX = (figureBounds.left + figureBounds.right) / 2;
    const centeredLeft = figureCenterX - toolbarWidth / 2;

    const minLeft = toolbarViewportMargin;
    const maxLeft = window.innerWidth - toolbarViewportMargin - toolbarWidth;

    const clampedLeft = clamp(centeredLeft, minLeft, maxLeft);

    setPosition({
      top: clampedTop,
      left: clampedLeft,
      placement: placement,
    });
  }, [figure]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  const toggleMenu = (menuName) => {
    setOpenMenu((currentMenu) => currentMenu === menuName ? null : menuName);
  };

  const renderColorSubmenu = () => {
    return (
      <div className="figure-sub-toolbar">
        {colorList.map((color, index) => (
          <div key={color.id} className="figure-sub-item">
            <button
              tabIndex={-1}
              className={`toolbar__color-picker ${color.isRainbow ? 'color-rainbow' : ''}`}
              style={{ '--picker-color': color.color }}
              title={color.title}
              onClick={() => onChangeColor(index)}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderWidthSubmenu = () => {
    return (
      <div className="figure-sub-toolbar">
        {widthList.map((width, index) => (
          <div key={width.name} className="figure-sub-item">
            <button
              tabIndex={-1}
              className={`toolbar__width-picker ${width.name}`}
              title={width.title}
              onClick={() => onChangeWidth(index)}
            >
              <div />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderEdgesSubmenu = () => {
    return (
      <div className="figure-sub-toolbar">
        <div className="figure-sub-item">
          <button tabIndex={-1} title={t('figure.sharp')} onClick={() => onChangeEdges(0)}>
            <MdSharpCorner />
          </button>
        </div>

        <div className="figure-sub-item">
          <button tabIndex={-1} title={t('figure.round')} onClick={() => onChangeEdges(1)}>
            <MdRoundedCorner />
          </button>
        </div>
      </div>
    );
  };

  const renderStrokeSubmenu = () => {
    return (
      <div className="figure-sub-toolbar">
        <div className="figure-sub-item">
          <button tabIndex={-1} title={t('figure.solid')} onClick={() => onChangeStroke(0)}>
            <TbMinus />
          </button>
        </div>

        <div className="figure-sub-item">
          <button tabIndex={-1} title={t('figure.dashed')} onClick={() => onChangeStroke(1)}>
            <TbLineDashed />
          </button>
        </div>

        <div className="figure-sub-item">
          <button tabIndex={-1} title={t('figure.dotted')} onClick={() => onChangeStroke(2)}>
            <TbLineDotted />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      id="figure-toolbar"
      ref={toolbarRef}
        className={[
          position.placement === 'top' && 'above-figure',
          openMenu && 'submenu-open',
        ].filter(Boolean).join(' ')}
      style={{ left: position.left, top: position.top }}
    >
      <div className={`figure-sub-item figure-sub-item--toolbar-centered ${openMenu === 'color' ? 'active' : ''}`}>
        <button
          tabIndex={-1}
          className={`toolbar__color-picker ${colorList[figureColorIndex].isRainbow ? 'color-rainbow' : ''}`}
          style={{ '--picker-color': colorList[figureColorIndex].color }}
          title={t('figure.color')}
          onClick={() => toggleMenu('color')}
        />

        {openMenu === 'color' && renderColorSubmenu()}
      </div>

      <div className={`figure-sub-item ${openMenu === 'width' ? 'active' : ''}`}>
        <button
          tabIndex={-1}
          className={`toolbar__width-picker ${widthList[figureWidthIndex].name}`}
          title={figureType === 'text' ? t('figure.textSize') : t('figure.lineWidth')}
          onClick={() => toggleMenu('width')}
        >
          <div />
        </button>

        {openMenu === 'width' && renderWidthSubmenu()}
      </div>

      {
        figureHasEdgeStyle && (
          <div className={`figure-sub-item ${openMenu === 'edges' ? 'active' : ''}`}>
            <button
              tabIndex={-1}
              title={t('figure.edges')}
              onClick={() => toggleMenu('edges')}
            >
              {figureEdgeIndex === 0 && <MdSharpCorner />}
              {figureEdgeIndex === 1 && <MdRoundedCorner />}
            </button>

            {openMenu === 'edges' && renderEdgesSubmenu()}
          </div>
        )
      }

      {
        figureHasStrokeStyle && (
          <div className={`figure-sub-item ${openMenu === 'stroke' ? 'active' : ''}`}>
            <button
              tabIndex={-1}
              title={t('figure.stroke')}
              onClick={() => toggleMenu('stroke')}
            >
              {figureStrokeIndex === 0 && <TbMinus />}
              {figureStrokeIndex === 1 && <TbLineDashed />}
              {figureStrokeIndex === 2 && <TbLineDotted />}
            </button>

            {openMenu === 'stroke' && renderStrokeSubmenu()}
          </div>
        )
      }

      <div className="figure-sub-cross-line" />

      <div className="figure-sub-item">
        <button
          tabIndex={-1}
          className="toolbar__delete-button"
          title={t('figure.delete')}
          onClick={onDelete}
        >
          <Icons.Trash />
        </button>
      </div>
    </div>
  );
};

export default FigureToolbar;
