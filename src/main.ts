import { Engine } from '@babylonjs/core';
import { createScene } from "./tree";

const canvas: HTMLCanvasElement = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine: Engine = new Engine(canvas, true);

const scene = createScene(engine, canvas);
engine.runRenderLoop(() => {
    scene.render();
});
window.addEventListener('resize', () => {
    engine.resize();
});
