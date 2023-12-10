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
    StandardMaterial, PBRMetallicRoughnessMaterial, Matrix,
} from '@babylonjs/core';
import * as BABYLON from '@babylonjs/core';

const sceneObjects: Array<AbstractMesh> = [];

const objSize = 5;
const halfSize = objSize / 2;

export const createScene = (engine: Engine, canvas: HTMLCanvasElement): Scene => {
    const scene = new Scene(engine);
    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogStart = 30.0;
    scene.fogEnd = 50.0;

    const camera = new BABYLON.ArcRotateCamera('camera', Tools.ToRadians(-90), Tools.ToRadians(72), 20, new Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    const hemisphericLight = new HemisphericLight('envLight', new Vector3(100, 100, 0), scene);
    hemisphericLight.diffuse = new Color3(1, 1, 1);
    hemisphericLight.specular = new Color3(1, 1, 0.8);
    hemisphericLight.intensity = 0.2;
    const light = new BABYLON.DirectionalLight('light', new Vector3(-10, -10, 0), scene);
    light.diffuse = Color3.FromHexString('#FFFFFF');
    light.specular = Color3.FromHexString('#FFFFCC');
    light.position = new Vector3(100, 100, 0);
    light.intensity = 0.5
    light.setEnabled(true);

    const centerSphere = MeshBuilder.CreateSphere('centerSphere', {segments: 16, diameter: objSize, sideOrientation: Mesh.DOUBLESIDE}, scene)
    centerSphere.name = 'centerSphere';
    centerSphere.position = new Vector3(0, halfSize + 0.2, 0);

    const sphere1 = MeshBuilder.CreateSphere('sphere1', {segments: 16, diameter: 2, sideOrientation: Mesh.DOUBLESIDE}, scene);
    sphere1.position = new Vector3(-objSize, halfSize, 0);
    const sphere2 = sphere1.clone('sphere2');
    sphere2.position = new Vector3(objSize, halfSize, 0);
    const sphere3 = sphere1.clone('sphere3');
    sphere3.position = new Vector3(0, halfSize, objSize);
    const sphere4 = sphere1.clone('sphere4');
    sphere4.position = new Vector3(0, halfSize, -objSize);

    const ground = MeshBuilder.CreatePlane('ground', { size: 100, sideOrientation: Mesh.BACKSIDE });
    ground.rotation.x = Tools.ToRadians(-90);
    const groundMat = new StandardMaterial('groundMat', scene);
    const mirrorTexture = new BABYLON.MirrorTexture('mirrorTexture', {ratio: 0.5}, scene, true);

    mirrorTexture.mirrorPlane = new BABYLON.Plane(0, -0.5, 0, 0);
    mirrorTexture.renderList = [sphere1, sphere2, sphere3, sphere4, centerSphere];
    mirrorTexture.level = 0.8;
    mirrorTexture.adaptiveBlurKernel = 20;
    groundMat.diffuseColor = Color3.Gray();

    groundMat.reflectionTexture = mirrorTexture;
    ground.material = groundMat;

    sceneObjects.push(ground, sphere1, sphere2, sphere3, sphere4, centerSphere);
    addShadow(light);
    addReflection(scene);
    (sphere1.material as PBRMetallicRoughnessMaterial).baseColor = Color3.Red();
    (sphere2.material as PBRMetallicRoughnessMaterial).baseColor = Color3.Green();
    (sphere3.material as PBRMetallicRoughnessMaterial).baseColor = Color3.Blue();
    (sphere4.material as PBRMetallicRoughnessMaterial).baseColor = Color3.Yellow();

    console.log(111, sphere1.position.subtract(centerSphere.position), Matrix.Translation(-objSize, 0, 0));
    [sphere1, sphere2, sphere3, sphere4].forEach((s) => {
        const m = s.position.subtract(centerSphere.position)
        s.setPivotMatrix(Matrix.Translation(m.x, m.y, m.z));
    })

    setAnimation(scene, [
        sphere1,
        sphere2,
        sphere3,
        sphere4,
    ]);
    return scene;
}

const setAnimation = (scene: Scene, spheres: Mesh[]) => {
    const alpha = Tools.ToRadians(0.5);
    let delta = 0;
    scene.registerBeforeRender(() => {
        delta += Tools.ToRadians(2);
        spheres.forEach((s, idx) => {
            s.rotation.y += alpha;
            s.position.y = halfSize + Math.cos(delta + Tools.ToRadians(idx * 90));
        })
    })

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

const addReflection = (scene: Scene): void => {
    sceneObjects.forEach((mesh) => {
        if (mesh.name == 'ground') {
            return;
        }
        const probe = new ReflectionProbe('probe_' + mesh.name, 256, scene);
        (probe.renderList as AbstractMesh[]).push(...sceneObjects.filter(m => { return m.name != mesh.name }));
        const material = new BABYLON.PBRMetallicRoughnessMaterial('refMat_' + mesh.name, scene);

        material.metallic = 0.5;
        material.roughness = 0.5;
        material.environmentTexture = probe.cubeTexture;
        mesh.material = material;
        probe.attachToMesh(mesh);
    });
}