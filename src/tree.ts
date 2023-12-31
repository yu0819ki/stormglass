import {
    Engine,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    Tools,
    Vector3,
    Color3,
    AbstractMesh,
    StandardMaterial,
    Texture,
    Material,
    CreateTube,
    CreateBox,
    CreateCylinder, ArcRotateCamera, ParticleSystem, BoxParticleEmitter, Color4,
} from '@babylonjs/core';
import {FurMaterial} from "@babylonjs/materials";
import {Inspector} from '@babylonjs/inspector'
import {WoodProceduralTexture} from "@babylonjs/procedural-textures";

const sceneObjects: Array<AbstractMesh> = [];

export const createScene = (engine: Engine, canvas: HTMLCanvasElement): Scene => {
    const scene = new Scene(engine);
    scene.clearColor = Color3.FromHexString('#B8D1F2').toColor4();

    // Fog
    scene.fogMode = Scene.FOGMODE_LINEAR;
    scene.fogStart = 30.0;
    scene.fogEnd = 50.0;
    scene.fogColor = Color3.FromHexString(scene.clearColor.toHexString(true));

    const camera = new ArcRotateCamera('camera', Tools.ToRadians(-90), Tools.ToRadians(90), 30, new Vector3(0, 10, 0), scene);
    camera.attachControl(canvas, true);

    const hemisphericLight = new HemisphericLight('envLight', new Vector3(100, 100, 0), scene);
    hemisphericLight.diffuse = Color3.FromHexString('#FFFFFF');
    hemisphericLight.specular = Color3.FromHexString('#FFFFCC');
    hemisphericLight.intensity = 1;

    const ground = buildSnowGround(100, scene);
    const tree = generateTree(4, 20, 4, getTrunkMaterial(scene), getLeavesMaterial(scene), scene);

    Inspector.Show(scene, {
        embedMode: true,
    })
    sceneObjects.push(ground, tree);
    fallSnow(20000, scene);

    return scene;
}

const generateTree = (layer: number, treeHeight: number, trunkRevealHeight: number, trunkMaterial: Material, leavesMaterial: Material, scene: Scene): Mesh => {
    const curvePoints = (l: number, t: number): Vector3[] => {
        const path = [];
        const step = l / t;
        for (let i = 0; i < l; i += step ) {
            path.push(new Vector3(0, i, 0));
            path.push(new Vector3(0, i, 0 ));
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

const buildSnowGround = (size: number, scene: Scene): Mesh => {
    const ground = MeshBuilder.CreateGround('ground', { width: size, height: size, subdivisions: 20});
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
    return ground;
}

const getTrunkMaterial = (scene: Scene): Material => {
    const trunkMat = new StandardMaterial('truncMat', scene);
    const trunkTx = new WoodProceduralTexture('truncTx', 512, scene);
    trunkTx.ampScale = 50;
    trunkMat.diffuseTexture = trunkTx;
    return trunkMat;
}

const getLeavesMaterial = (scene: Scene): Material => {
    const leavesMat = new StandardMaterial('leavesMat', scene);
    leavesMat.diffuseColor = Color3.Green();
    return leavesMat;
}

const fallSnow = (capacity: number, scene: Scene) => {
    const ps = new ParticleSystem('snowParticleSystem', capacity, scene);
    ps.particleTexture = new Texture('SnowDot.png', scene);
    ps.emitter = new Vector3(0, 50, 0);
    const boxEmitter = new BoxParticleEmitter();
    boxEmitter.direction1 = Vector3.Zero();
    boxEmitter.direction2 = Vector3.Zero();
    boxEmitter.minEmitBox = new Vector3(-50, 0, -50);
    boxEmitter.maxEmitBox = new Vector3(50, 0, 50);
    ps.particleEmitterType = boxEmitter;
    ps.minSize = 0.1;
    ps.maxSize = 0.2;
    ps.minLifeTime = 12;
    ps.maxLifeTime = 16;
    ps.emitRate = 1000;
    ps.gravity = new Vector3(0, -0.5, 0);
    ps.noiseStrength = new Vector3(10, 10, 10);
    ps.blendMode = ParticleSystem.BLENDMODE_ONEONE;
    ps.textureMask = new Color4(1, 1, 1, 1);

    ps.start();
}

