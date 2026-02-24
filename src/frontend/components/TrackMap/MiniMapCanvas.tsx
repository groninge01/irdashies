import { MiniMapSvg, MiniMapSvgProps } from './MiniMapSvg';

export type MiniMapCanvasProps = MiniMapSvgProps;

export const MiniMapCanvas = (props: MiniMapCanvasProps) => {
  return <MiniMapSvg {...props} />;
};
