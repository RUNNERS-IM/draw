import type { Callback, ColorOption } from '../types';
import './TextEditor.scss';

import { useRef, useEffect } from 'react';
import { widthList, lineHeightMultiplier } from "../constants";
import { hslTextGradientStops, getCursorColor } from "./drawer/figures";

const TextEditor = ({
  textEditorContainer,
  handleTextEditorBlur,
  colorList,
}: { textEditorContainer: any; handleTextEditorBlur: Callback; colorList: ColorOption[] }) => {
  const textAreaRef = useRef<any>(null);

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const handleKeyDown = (e: any) => {
      if (e.key === 'Escape') {
        textArea.blur();
      }
    };

    textArea.addEventListener('keydown', handleKeyDown);
    return () => {
      textArea.removeEventListener('keydown', handleKeyDown);
    };
  }, [textEditorContainer]);

  useEffect(() => {
    if (!textEditorContainer) { return }

    const textArea = textAreaRef.current;
    if (!textArea) { return }

    if (textEditorContainer.isActive) {
      if (textEditorContainer.text.length > 0) {
        textArea.innerText = textEditorContainer.text;

        selectTextArea(textArea);
        handleInput();
      }

      textArea.focus();
    } else {
      textArea.blur();
    }
  }, [textEditorContainer]);

  const onBlur = () => {
    const textArea = textAreaRef.current;
    if (!textArea) { return }

    const text = textArea.innerText || '';

    handleTextEditorBlur(text);
  };

  const handleInput = () => {
    const textArea = textAreaRef.current;
    if (!textArea) { return }

    if (!colorList[textEditorContainer.colorIndex].isRainbow) {
      return;
    }

    const height = textArea.offsetHeight;
    // const height = textArea.getBoundingClientRect().height

    const [_distance, hslStops] = hslTextGradientStops([0, 0], [0, height], textEditorContainer.rainbowColorDeg, textEditorContainer.scale) // Vertical Gradient

    textArea.style.background = `linear-gradient(180deg, ${hslStops.join(", ")})`;
    textArea.style.webkitBackgroundClip = "text";
    textArea.style.webkitTextFillColor = "transparent";
  }

  const selectTextArea = (textArea: any) => {
    const sel = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(textArea);
    sel!.removeAllRanges();
    sel!.addRange(range);
  }

  const top = textEditorContainer.startAt[1];
  const left = textEditorContainer.startAt[0];
  const scale = textEditorContainer.scale;

  const color = getCursorColor(colorList, textEditorContainer.colorIndex, textEditorContainer.rainbowColorDeg);
  const fontSize = widthList[textEditorContainer.widthIndex].font_size * scale;
  let width = textEditorContainer.width * scale;
  let textEditorClassName = 'fixed-width';

  if (textEditorContainer.autoResize) {
    width = 'auto' as any;
    textEditorClassName = '';
  }

  return (
    <div
      id="contentEditable"
      className={textEditorClassName}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck="false"
      ref={textAreaRef}
      onBlur={onBlur}
      onInput={handleInput}
      style={{
        top: top,
        left: left,
        width: width,
        color: color,
        fontSize: fontSize,
        '--line-height-multiplier': lineHeightMultiplier,
      }}
    />
  );
};

export default TextEditor;
