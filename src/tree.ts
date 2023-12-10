import {
    Engine,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    ShadowGenerator,
    Tools,
    Vector3,
    Color3,
    ReflectionProbe,
    AbstractMesh,
    IShadowLight,
    StandardMaterial,
    PBRMetallicRoughnessMaterial,
    Matrix,
    Texture,
    DynamicTexture,

    Material,
    CreateTube,
    CreateBox,
    TransformNode, CreateCylinder,
} from '@babylonjs/core';
import * as BABYLON from '@babylonjs/core';
import {FurMaterial} from "@babylonjs/materials";
import {Inspector} from '@babylonjs/inspector'
import {WoodProceduralTexture} from "@babylonjs/procedural-textures";

const sceneObjects: Array<AbstractMesh> = [];

const objSize = 5;
const halfSize = objSize / 2;

export const createScene = (engine: Engine, canvas: HTMLCanvasElement): Scene => {
    const scene = new Scene(engine);
    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogStart = 30.0;
    scene.fogEnd = 50.0;

    const camera = new BABYLON.ArcRotateCamera('camera', Tools.ToRadians(-90), Tools.ToRadians(90), 30, new Vector3(0, 10, 0), scene);
    camera.attachControl(canvas, true);

    const hemisphericLight = new HemisphericLight('envLight', new Vector3(100, 100, 0), scene);
    hemisphericLight.diffuse = new Color3(1, 1, 1);
    hemisphericLight.specular = new Color3(1, 1, 1);
    hemisphericLight.intensity = 0.5;
    const light = new BABYLON.DirectionalLight('light', new Vector3(-10, -10, 0), scene);
    light.diffuse = Color3.FromHexString('#FFFFFF');
    light.specular = Color3.FromHexString('#FFFFFF');
    light.position = new Vector3(100, 100, 0);
    light.intensity = 0.3;
    light.setEnabled(true);

    const ground = MeshBuilder.CreateGround('ground', { width: 100, height: 100, subdivisions: 20});
    const snowMat = new FurMaterial('snowMat', scene);
    snowMat.highLevelFur = true;
    snowMat.furLength = 1;
    snowMat.furAngle = 0;
    snowMat.furColor = Color3.White();
    snowMat.diffuseTexture = new Texture('1x1-ffffffff.png');
    snowMat.furSpacing = 1;
    snowMat.furDensity = 1;
    snowMat.furSpeed = 10000;

    ground.material = snowMat;
    FurMaterial.FurifyMesh(ground, 90);

    sceneObjects.push();
    // addShadow(light);
    const trunkMat = new StandardMaterial('truncMat', scene);
    const trunkTx = new WoodProceduralTexture('truncTx', 512, scene);
    trunkTx.ampScale = 50;
    trunkMat.diffuseTexture = trunkTx;
    const leavesMat = new StandardMaterial('leavesMat', scene);
    leavesMat.diffuseColor = Color3.Green();
    const tree = generateTree(4, 20, 4, trunkMat, leavesMat, scene);

    Inspector.Show(scene, {
        embedMode: true,
    })
    return scene;
}

const addShadow = (light: IShadowLight): void => {
    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.useContactHardeningShadow = true;
    shadowGenerator.useBlurCloseExponentialShadowMap = true;
    shadowGenerator.setDarkness(0.1);

    light.shadowMaxZ = 1000;
    light.shadowMinZ = 100;
    sceneObjects.forEach((mesh) => {
        mesh.receiveShadows = true;
        shadowGenerator.addShadowCaster(mesh);
    });
}

const generateTree = (layer: number, treeHeight: number, trunkRevealHeight: number, trunkMaterial: Material, leavesMaterial: Material, scene: Scene): Mesh => {
    const curvePoints = (l: number, t: number): Vector3[] => {
        const path = [];
        const step = l / t;
        for (let i = 0; i < l; i += step ) {
            path.push(new BABYLON.Vector3(0, i, 0));
            path.push(new BABYLON.Vector3(0, i, 0 ));
        }
        return path;
    };
    const leavesHeight = treeHeight - trunkRevealHeight;

    const nbL = layer + 1;
    const curve = curvePoints(leavesHeight, nbL);

    const radiusFunction = (i: number, _: number) => {
        const fact = (i % 2 == 0) ? 0.5 : 1;
        return (nbL * 2 - i - 1) * fact;
    };
    const leaves = CreateTube('leaves', {path: curve, radius: 0, tessellation: 10, cap: Mesh.CAP_START, radiusFunction}, scene);
    leaves.material = leavesMaterial;
    const trunk = CreateCylinder('trunk', {height: trunkRevealHeight, diameter: layer, tessellation: 12, subdivisions: 1}, scene)
    trunk.material = trunkMaterial;
    const box = CreateBox('treeBox', {size: 1}, scene);
    box.isVisible = false
    leaves.parent = box;
    trunk.parent = box;
    leaves.position.y = trunkRevealHeight;
    trunk.position.y = trunkRevealHeight / 2;
    return leaves;
}

