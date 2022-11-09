<template>
  <div id="mainDiv">
    <div id="textDiv">
      <text id="errorText" v-if="showErrorInfo">加载失败，请检查资源</text>
    </div>
    <canvas id="threeCanvas" ref="threeCanvas"></canvas>
    <progress id="progress" v-if="showProgress" :value="progressValue" max="100"></progress>
  </div>
</template>

<script>
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';


let camera,
  scene,
  scene_selectObjects,
  renderer,
  controls,
  tickId,
  scale,
  objects,
  effect,
  gui,
  raycaster,
  skyBox,
  labelRenderer,
  defaultFOV,
  infoMap
  ;

var STATE_TYPE = {
  EDITOR: 'editor',
  RUNTIME: 'runtime',
}

var SPOT_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  LINK: 'link',
  PANORAMA_LINK: 'panorama_link',
}

var SYSTEM_ICON = {
  TEXT: 'https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/editor/systemIcon/54_static_txt.png',
  IMAGE: 'https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/editor/systemIcon/57_static_gallery.png',
  VIDEO: 'https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/editor/systemIcon/56_static_video.png',
  AUDIO: 'https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/editor/systemIcon/55_static_music.png',
  LINK: 'https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/editor/systemIcon/53_static_link.png',
  PANORAMA_LINK: 'https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/editor/systemIcon/18_new_spotd1.png',
}

const option = {
  type: SPOT_TYPE.TEXT,
  title: '输入标题',
  content: '垂直居中单独文字只需要设置css样式line-height属性即可。cal-align:middle垂直居中属性，如img{vertical-align:middle;}',
  systemIcon: 'https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/editor/systemIcon/54_static_txt.png',
  state: 'editor',
  addHotSpot: () => {
    if (option.state === STATE_TYPE.RUNTIME) return;

    const mouse = new THREE.Vector2();
    // 默认在屏幕中间添加热点文本
    mouse.x = 0.5 * 2 - 1;
    mouse.y = -0.5 * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    // 计算与cubemap焦点
    const intersections = raycaster.intersectObjects([skyBox], true);
    if (intersections[0]) {
      // 获取焦点坐标
      const position = intersections[0].point;

      // 创建新的div
      const newDiv = document.createElement('div');
      newDiv.className = option.type;

      // 记录热点属性
      infoMap.set(newDiv, [option.title, option.content, option.systemIcon]);

      // 外层div flex direction center
      const border = document.createElement('div');
      border.style.display = 'flex';
      border.style.flexDirection = 'column';
      border.style.alignItems = 'center';
      border.style.justifyItems = 'center';
      newDiv.appendChild(border);

      // 添加标题
      const title = document.createElement('div');
      title.textContent = option.title;
      // title.style.fontWeight = '450';
      title.style.fontSize = '14px';
      title.style.padding = '3px 10px 3px 10px';
      title.style.backgroundColor = 'black';
      title.style.opacity = '0.7';
      title.style.borderRadius = '4px';
      // 文字颜色
      title.style.color = 'white';
      border.appendChild(title);

      // 创建icon
      const image = document.createElement('div');
      // 图片size
      image.style.width = '52px';
      image.style.height = '52px';
      // 设置icon url
      image.style.background = 'url(' + option.systemIcon + ')';
      image.style.backgroundSize = 'contain';
      image.style.backgroundPosition = 'center';
      border.appendChild(image);

      // 创建对应的CSS2DObject
      const newDivObject = new CSS2DObject(newDiv);

      // 将CSS2DObject挂在div上
      newDiv.threeObject = newDivObject;

      // 设置CSS2DObject在scene中坐标
      newDivObject.position.set(position.x, position.y, position.z);

      // 添加到场景
      scene.add(newDivObject);

      // 设置div鼠标悬停时样式
      newDiv.onmouseover = (event) => {
        event.target.style.cursor = 'pointer';
      }

      // 监听鼠标点击事件
      newDiv.onmousedown = (e) => {
        if (option.state === STATE_TYPE.RUNTIME) {
          // 判断类型
          if (newDiv.className === SPOT_TYPE.TEXT) {
            // 获取mainDiv
            const mainDiv = document.getElementById('mainDiv');
            // 创建文本窗口
            const textWindow = document.createElement('div');
            textWindow.style.width = '30%';
            textWindow.style.height = '10%';
            textWindow.style.position = 'absolute';
            textWindow.style.left = '35%';
            textWindow.style.top = '40%';
            textWindow.style.backgroundColor = 'white';
            textWindow.style.display = 'flex';
            textWindow.style.flexDirection = 'column';
            textWindow.style.alignItems = 'center';
            textWindow.style.zIndex = 20;
            mainDiv.appendChild(textWindow);

            // 获取当前热点属性
            const info = infoMap.get(newDiv);

            // 创建标题栏
            const titleBar = document.createElement('div');
            titleBar.style.width = '100%';
            titleBar.style.height = '25px';
            titleBar.textContent = info[0];
            titleBar.style.borderBottomColor = 'gray';
            titleBar.style.borderBottom = '1px solid'
            titleBar.style.paddingLeft = '4px';
            titleBar.style.fontSize = 'medium';
            titleBar.style.fontWeight = '600';
            textWindow.appendChild(titleBar);

            // 创建关闭按钮
            const closeButton = document.createElement('div');
            closeButton.style.position = 'absolute';
            closeButton.style.top = '4px';
            closeButton.style.right = '2px';
            closeButton.style.background = 'url(https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/editor/systemIcon/close.png)'; 
            closeButton.style.width = '16px';
            closeButton.style.height = '16px';
            closeButton.style.backgroundSize = 'contain';
            closeButton.style.backgroundPosition = 'center';
            closeButton.onclick = (e)=>{
              // 移除文本窗口
              textWindow.remove();
              // 激活相机控制器
              controls.enabled =  true;
            }
            titleBar.appendChild(closeButton);

            // 创建文本框
            const textDiv = document.createElement('div');
            textDiv.style.width = '100%';
            textDiv.style.height = '100%';
            textDiv.style.backgroundColor = 'white';
            textDiv.textContent = info[1];
            textDiv.style.paddingLeft = '4px';
            textDiv.style.paddingRight = '4px';
            textWindow.appendChild(textDiv);

            // 关闭相机控制器
            controls.enabled = false;
          } else if (newDiv.className === SPOT_TYPE.AUDIO) {

          } else if (newDiv.className === SPOT_TYPE.IMAGE) {

          } else if (newDiv.className === SPOT_TYPE.LINK) {

          } else if (newDiv.className === SPOT_TYPE.VIDEO) {

          } else if (newDiv.className === SPOT_TYPE.PANORAMA_LINK) {

          }
          return;
        }
        console.log('+++++++++++++ onmousedown');
        // 暂停更新div位置
        newDiv.threeObject.isCSS2DObject = false;
        // 暂停相机控制
        controls.enabled = false;
        e = e || window.event;
        e.preventDefault();
        // 记录当前鼠标位置
        newDiv.lastClientX = e.clientX;
        newDiv.lastClientY = e.clientY;

        // 计算div translateX和translateY的值
        var style = window.getComputedStyle(newDiv);
        var matrix = new WebKitCSSMatrix(style.transform);
        // 因为translate(-50%, -50%)故需要考虑宽高
        newDiv.lastTranslateX = matrix.m41 + newDiv.clientWidth / 2;
        newDiv.lastTranslateY = matrix.m42 + newDiv.clientHeight / 2;

        // 设置鼠标移动事件
        document.onmousemove = (e) => {
          console.log('+++++++++++++ onmousedown');

          // 设置鼠标样式为小手
          e.target.style.cursor = 'pointer';

          e = e || window.event;
          e.preventDefault();
          // 计算当前鼠标位置和初始位置差值
          let tempx = newDiv.lastClientX - e.clientX;
          let tempy = newDiv.lastClientY - e.clientY;
          // 记录当前鼠标位置
          newDiv.lastClientX = e.clientX;
          newDiv.lastClientY = e.clientY;

          // 计算transltae
          let translateX = newDiv.lastTranslateX - tempx;
          let translateY = newDiv.lastTranslateY - tempy;

          // 记录translate
          newDiv.lastTranslateX = translateX;
          newDiv.lastTranslateY = translateY;

          // 设置translate，translate(-50%, -50%)与CSS2DRender保持一致
          newDiv.style.transform = 'translate(-50%, -50%) translate(' + translateX + 'px,' + translateY + 'px)';
        }

        document.onmouseup = (event) => {
          if (option.state === STATE_TYPE.RUNTIME) return;
          console.log('+++++++++++++ onmouseup');
          // 取消onmouseup、onmousemove事件监听
          document.onmouseup = null;
          document.onmousemove = null;

          // 设置为默认鼠标样式
          event.target.style.cursor = 'auto';

          // 相机控制器激活
          controls.enabled = true;

          // 计算cssobject世界坐标
          if (raycaster && skyBox && camera && scene) {
            const mouse = new THREE.Vector2();
            mouse.x = (newDiv.lastTranslateX / window.innerWidth) * 2 - 1;
            mouse.y = -(newDiv.lastTranslateY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersections = raycaster.intersectObjects([skyBox], true);
            if (intersections[0]) {
              const position = intersections[0].point;
              // 设置position
              newDiv.threeObject.position.set(position.x, position.y, position.z);
              // 激活div位置实时更新
              newDiv.threeObject.isCSS2DObject = true;
            }
          }
        }
      }


    }
  }
};

export default {
  props: {
    modelUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showErrorInfo: false,
      showProgress: false,
      progressValue: 0,
    };
  },
  mounted() {
    this.initScene(this.modelUrl);
  },
  methods: {

    initScene(modelUrl) {
      infoMap = new Map();
      // 添加GUI
      gui = new GUI();
      const hotspotTypeFolder = gui.addFolder('hotspotType');
      const titleFolder = gui.addFolder('title');
      const iconFolder = gui.addFolder('icon');
      const contentFolder = gui.addFolder('content');

      hotspotTypeFolder
        .add(option, 'type', [SPOT_TYPE.TEXT, SPOT_TYPE.IMAGE, SPOT_TYPE.VIDEO, SPOT_TYPE.AUDIO, SPOT_TYPE.LINK, SPOT_TYPE.PANORAMA_LINK])
        .onChange(
          (value) => {
            console.log(value);
          }
        );

      // 设置title
      titleFolder
        .add(option, 'title')
        .onChange(
          (value) => {
            option.title = value;
          }
        );

      // 设置title
      iconFolder
        .add(option, 'systemIcon', [SYSTEM_ICON.TEXT, SYSTEM_ICON.IMAGE, SYSTEM_ICON.VIDEO, SYSTEM_ICON.AUDIO, SYSTEM_ICON.LINK, SYSTEM_ICON.PANORAMA_LINK])
        .onChange(
          (value) => {
            // option.title = value;

          }
        );

      // 内容
      contentFolder
        .add(option, 'content')
        .onChange(
          (value) => {
            option.content = value;
          }
        );


      gui
        .add(option, 'state', [STATE_TYPE.EDITOR, STATE_TYPE.RUNTIME])
        .onChange(
          (value) => {
            if (value === STATE_TYPE.RUNTIME) {
              // todo:预览动画
              if (camera) {
                var step = { fov: 130 };
                TWEEN.removeAll();
                // 使用tween创建fov动画
                const tween = new TWEEN.Tween(step);
                tween.to({ fov: defaultFOV }, 1000);
                tween.easing(TWEEN.Easing.Exponential.InOut);
                tween.onUpdate(() => {
                  camera.fov = step.fov;
                  camera.updateProjectionMatrix();
                });
                tween.start();
              }

            }
          }
        );

      // 设置addHotSpot
      gui.add(option, 'addHotSpot');

      scale = 1;
      objects = [];
      // reset
      this.destroy();

      // 相机far
      const cameraMaxDistance = 12000;

      // 添加透视相机，设置fov、初始位置
      camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        30,
        cameraMaxDistance
      );
      defaultFOV = camera.fov;

      camera.position.set(0, 0, 100);

      // 添加场景及颜色
      scene = new THREE.Scene();
      // scene.background = new THREE.Color(0xffffff);

      scene_selectObjects = new THREE.Scene();
      // scene_selectObjects.background = new THREE.Color(0xffffff);

      // 添加光源
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
      hemiLight.position.set(0, 2000, 0);
      hemiLight.intensity = 0.8;
      scene.add(hemiLight);
      const hemiLight1 = new THREE.HemisphereLight(0xffffff, 0x444444);
      hemiLight1.position.set(0, 2000, 0);
      hemiLight1.intensity = 0.8;
      scene_selectObjects.add(hemiLight1);

      // 设置直射光
      const dirLight = new THREE.DirectionalLight(0xdddddd);
      dirLight.castShadow = false;
      dirLight.intensity = 0.2;
      dirLight.position.set(0, 1000, 1000);
      scene.add(dirLight);
      const dirLight1 = new THREE.DirectionalLight(0xdddddd);
      dirLight1.castShadow = false;
      dirLight1.intensity = 0.2;
      dirLight1.position.set(0, 1000, 1000);
      scene_selectObjects.add(dirLight1);

      // 添加WebGLRenderer，设置size
      renderer = new THREE.WebGLRenderer({
        canvas: this.$refs.threeCanvas,
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth * scale, window.innerHeight * scale);
      renderer.shadowMap.enabled = false;

      // 添加CSS2DRenderer
      labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0px';
      const mainDiv = document.getElementById('mainDiv');
      mainDiv.appendChild(labelRenderer.domElement);

      // 添加相机控制器
      controls = new OrbitControls(camera, labelRenderer.domElement);
      // controls.autoRotate = true;
      controls.autoRotateSpeed = 1.5;
      controls.enablePan = false;
      controls.target.set(0, 0, 0);

      // 加载进度manager
      const manager = new THREE.LoadingManager();
      const loader = new FBXLoader(manager);
      // 除湿机
      loader.load(
        "https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/save_fbx/AJ0261M07-模型.fbx",
        (object) => {
          object.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
            }
            child.userData.parent = object;
          });
          // 设置object position
          object.position.set(-650, -600, -2200);

          // 添加object到场景里
          scene.add(object);
          objects.push(object);
        }
      );

      // 体脂秤
      loader.load(
        "https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/save_fbx/JM03F400Y-模型.fbx",
        (object) => {
          object.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
            }
            child.userData.parent = object;
          });
          // 设置object position
          object.position.set(700, -930, -2300);

          // 添加object到场景里
          scene.add(object);
          objects.push(object);
        }
      );

      // 电视
      loader.load(
        "https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/save_fbx/DH1UN0A02-模型1.fbx",
        (object) => {
          object.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
            }
            child.userData.parent = object;
          });
          // 设置object position
          object.position.set(1760, 95, -1790);

          // 添加object到场景里
          scene.add(object);
          objects.push(object);
        }
      );

      // px = right
      // nx = left
      // py = top
      // ny = bottom
      // pz = front
      // nz = back
      const textures = [];
      const px = new THREE.TextureLoader().load(
        "https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/px.jpg"
      );
      const nx = new THREE.TextureLoader().load(
        "https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/nx.jpg"
      );
      const py = new THREE.TextureLoader().load(
        "https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/py.jpg"
      );
      const ny = new THREE.TextureLoader().load(
        "https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/ny.jpg"
      );
      const pz = new THREE.TextureLoader().load(
        "https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/pz.jpg"
      );
      const nz = new THREE.TextureLoader().load(
        "https://syn-yf-design-tool.oss-cn-beijing.aliyuncs.com/panorama/nz.jpg"
      );
      textures.push(px);
      textures.push(nx);
      textures.push(py);
      textures.push(ny);
      textures.push(pz);
      textures.push(nz);
      const materials = [];
      for (let i = 0; i < 6; i++) {
        materials.push(new THREE.MeshBasicMaterial({ map: textures[i] }));
      }
      skyBox = new THREE.Mesh(
        new THREE.BoxGeometry(5000, 5000, 5000),
        materials
      );
      skyBox.geometry.scale(1, 1, -1);
      scene.add(skyBox);

      // 创建线框效果
      effect = new OutlineEffect(renderer, {
        defaultThickness: 0.003,
        defaultColor: [0, 0, 1],
      });

      raycaster = new THREE.Raycaster();

      // 监听窗口reszie事件
      window.addEventListener("resize", this.onWindowResize);
      // 监听窗口reszie事件
      window.addEventListener("mousedown", this.onMouseDown);
      // 设置tick
      this.animate();

      document.addEventListener("click", this.onClick);
    },

    // 加载进度
    onProgress(xhr) {
      if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        this.progressValue = Math.round(percentComplete, 2);
        // console.log("model " + Math.round(percentComplete, 2) + "% downloaded");
      }
    },

    // 加载失败回掉
    onError(error) {
      console.log(error.message);
      this.showProgress = false;
      this.$refs.threeCanvas.hidden = true;
      this.showErrorInfo = true;
    },

    // 重置窗口大小
    onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      // 更新相机投影矩阵
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth * scale, window.innerHeight * scale);
      labelRenderer.setSize(window.innerWidth, window.innerHeight);

    },

    // 鼠标点击事件
    onMouseDown() {
      controls.autoRotate = false;
    },

    // 点击事件
    onClick(event) {
      event.preventDefault();

      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersections = raycaster.intersectObjects(objects, true);
      if (intersections[0]) {
        objects.forEach((obj) => {
          scene.remove(obj);
          scene_selectObjects.remove(obj);
        });
        objects.forEach((obj) => {
          scene.add(obj);
        });

        scene.remove(intersections[0].object.userData.parent);
        scene_selectObjects.add(intersections[0].object.userData.parent);
      }
    },

    // 每帧调用
    animate() {
      // 清除背景色

      // 获取callback handler
      tickId = requestAnimationFrame(this.animate);
      // 更新control状态
      controls.update();
      // 每帧渲染
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);

      renderer.autoClear = false;
      // 渲染描边物体
      effect.autoClear = renderer.autoClear;
      effect.render(scene_selectObjects, camera);
      renderer.autoClear = true;
      effect.autoClear = renderer.autoClear;

      TWEEN.update();
    },
    // 清空场景
    destroy() {
      // 使用handler取消每帧调用
      cancelAnimationFrame(tickId);
      // 移除resize监听
      window.removeEventListener("resize", this.onWindowResize);
      // 移除mouseDown监听
      window.removeEventListener("mousedown", this.onMouseDown);
      if (renderer) {
        renderer.domElement.addEventListener("dblclick", null, false); //remove listener to render
        renderer.forceContextLoss();
      }
      renderer = null;
      scene = null;
      scene_selectObjects = null;
      camera = null;
      controls = null;
    },
  },

  beforeDestroy() {
    console.log("beforeDestroy");
    // 清除场景
    this.destroy();
  },
};
</script>

<style scoped>
#mainDiv {
  width: 100%;
  height: 100%;
  position: relative;
}

#three {
  width: 100%;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
}

#progress {
  width: 40%;
  height: 2rem;
  position: fixed;
  left: 30%;
  top: 47%;
}

#textDiv {
  position: fixed;
  width: 100%;
  height: 40px;
  line-height: 40px;
  text-align: center;
  top: 46%;
}
</style>
