import * as THREE from '../../lib/three.module.js'
import PublicMethod from '../../method/method.js'
import ShaderMethod from '../../method/method.shader.js'

import Particle from './build/visualizer.particle.build.js'

export default class{
    constructor({app, audio}){
        this.ratio = app.ratio
        this.renderer = app.renderer
        this.audio = audio

        this.param = {
            fov: 60,
            near: 0.1,
            far: 10000,
            pos: 100
        }

        this.modules = {
            Particle
        }
        this.group = {}
        this.comp = {}
        this.build = new THREE.Group()

        // this.sources = [
        //     './assets/src/1.png'
        // ]

        // this.sources2 = [
        //     './assets/src/trail_fg.png',
        //     './assets/src/drop_fg2.png'
        // ]

        this.init()
    }


    // init
    async init(){
        this.initGroup()
        this.initRenderObject()
        this.initGPU()

        // this.textures = await this.getTextures(this.sources2)
        // this.images = await this.getImages(this.sources)

        this.create()
        this.add()
    }
    initGroup(){
        for(const module in this.modules){
            this.group[module] = new THREE.Group()
            this.comp[module] = null
        }
    }
    initRenderObject(){
        this.element = document.querySelector('.visualizer-object')

        const {width, height} = this.element.getBoundingClientRect()

        // const w = width * RATIO
        // const h = height * RATIO

        this.scene = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera(this.param.fov, width / height, this.param.near, this.param.far)
        this.camera.position.z = this.param.pos
        
        this.size = {
            el: {
                w: width * RATIO,
                h: height * RATIO
            },
            obj: {
                w: PublicMethod.getVisibleWidth(this.camera, 0),
                h: PublicMethod.getVisibleHeight(this.camera, 0)
            }
        }
    }
    initGPU(){
        this.gpu = new GPU()
    }


    // add
    add(){
        for(let i in this.group) this.build.add(this.group[i])
        
        this.scene.add(this.build)
    }


    // create
    create(){
        for(const module in this.modules){
            const instance = this.modules[module]
            const group = this.group[module]

            this.comp[module] = new instance({group, size: this.size, renderer: this.renderer, camera: this.camera, comp: this.comp, textures: this.textures, images: this.images, gpu: this.gpu, audio: this.audio})
        }
    }


    // get
    getTextures(sources){
        return new Promise((resolve, _) => {
            // resolve when loading complete
            const manager = new THREE.LoadingManager(() => resolve(textures))
            
            // bind manager to loader
            const loader = new THREE.TextureLoader(manager)
            
            // load textures
            const textures = sources.map(source => loader.load(source))
        })
    }
    getImage(urls){
        return urls.map(url => new Promise((resolve, _) => {
            const img = new Image()

            img.onload = () => {
                resolve(img)
            }

            img.src = url
        }))
    }
    getImages(sources){
        return Promise.all(this.getImage(sources))
    }


    // animate
    animate(){
        this.render()
        this.animateObject()
    }
    render(){
        const rect = this.element.getBoundingClientRect()
        const width = rect.right - rect.left
        const height = rect.bottom - rect.top
        const left = rect.left
        const bottom = this.renderer.domElement.clientHeight - rect.bottom

        // app.renderer.clear()

        this.renderer.setScissor(left, bottom, width, height)
        this.renderer.setViewport(left, bottom, width, height)

        this.camera.lookAt(this.scene.position)
        this.renderer.render(this.scene, this.camera)
    }
    animateObject(){
        for(let i in this.comp){
            if(!this.comp[i] || !this.comp[i].animate) continue
            this.comp[i].animate()
        }
    }


    // resize
    resize(){
        const rect = this.element.getBoundingClientRect()
        const width = rect.right - rect.left
        const height = rect.bottom - rect.top

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        // const w = width * RATIO
        // const h = height * RATIO

        this.size = {
            el: {
                w: width * RATIO,
                h: height * RATIO
            },
            obj: {
                w: PublicMethod.getVisibleWidth(this.camera, 0),
                h: PublicMethod.getVisibleHeight(this.camera, 0)
            }
        }

        this.resizeObject()
    }
    resizeObject(){
        for(let i in this.comp){
            if(!this.comp[i] || !this.comp[i].resize) continue
            this.comp[i].resize(this.size)
        }
    }
}