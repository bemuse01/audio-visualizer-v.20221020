import Particle from '../../objects/particle.js'
import Shader from '../shader/visualizer.particle.shader.js'
import Method from '../../../method/method.js'
import ShaderMethod2 from '../../../method/method.shader2.js'

export default class{
    constructor({group, gpu, audio}){
        this.group = group
        this.gpu = gpu
        this.audio = audio

        this.param = {
            rad: 25,
            radStep: 0.2,
            count: 720,
            countStep: 120,
            iter: 16,
            pointSize: 5,
            opacity: 0.15,
            smooth: 0.2,
            boost: 3,
            fre: 0.00175,
            range: 6
        }

        this.init()
    }


    // init
    init(){
        this.create()
        this.createGPGPU()
    }


    // create
    create(){
        this.object = new Particle({
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {
                    pointSize: {value: this.param.pointSize},
                    opacity: {value: this.param.opacity},
                    audioData: {value: 0},
                    time: {value: 0}
                }
            }
        })

        const {position, nPosition, move} = this.createAttribute()
        this.object.setAttribute('position', new Float32Array(position), 3)
        this.object.setAttribute('nPosition', new Float32Array(nPosition), 2)
        this.object.setAttribute('move', new Float32Array(move), 2)

        this.group.add(this.object.get())
    }
    createAttribute(){
        const {rad, radStep, count, countStep, iter} = this.param

        const position = []
        const nPosition = []
        const move = []
        const minRad = rad
        const maxRad = rad + radStep * (iter - 1)

        for(let i = 0; i < iter; i++){

            const r = rad + radStep * i
            const c = count + countStep * i
            const deg = 360 / c
            const nr = Method.normalize(r, 1, 2, minRad, maxRad)

            for(let j = 0; j < c; j++){
                const degree = (deg * j) * RADIAN
                const x = Math.cos(degree) * r
                const y = Math.sin(degree) * r

                const nx = Math.cos(degree) * nr
                const ny = Math.sin(degree) * nr

                position.push(x, y, 0)
                nPosition.push(nx, ny)
                move.push(0, 0)
            }

        }

        return {position, nPosition, move}
    }


    // gpgpu
    createGPGPU(){
        this.createGpuKernels()
    }
    createGpuKernels(){
        this.moveParticle = this.gpu.createKernel(function(pos, time, audioDataAvg){
            const i = this.thread.x
            const idx = i * 2
            const smooth = this.constants.smooth
            const boost = this.constants.boost
            const fre = this.constants.fre
            const range = this.constants.range

            const x = pos[idx + 0]
            const y = pos[idx + 1]

            // const theta = x * Math.PI + time * 0.001
            // const phi = y * Math.PI * 2.0 + time * 0.001
            const n1 = simplexNoise3D([x * smooth, y * smooth, time * fre])
            const n2 = simplexNoise3D([x * smooth * boost, y * smooth * boost, time * fre])

            const rx = n1 * range * audioDataAvg
            const ry = n2 * range * audioDataAvg

            return [rx, ry]
        }).setDynamicOutput(true)

        this.moveParticle.setInjectedNative(ShaderMethod2.snoise3DHelper())
        this.moveParticle.addNativeFunction('simplexNoise3D', ShaderMethod2.snoise3D())
    }


    // animate
    animate(){
        // if(!this.play) return
        if(!this.audio.audioDataAvg) return

        this.updateParticle()
    }
    updateParticle(){
        const nPosition = this.object.getAttribute('nPosition')
        const move = this.object.getAttribute('move')
        const {count} = move
        const time = window.performance.now()

        this.moveParticle.setOutput([count])
        this.moveParticle.setConstants({
            smooth: this.param.smooth,
            boost: this.param.boost,
            fre: this.param.fre,
            range: this.param.range
            // radius2,
            // count2
        })

        // const temp = []
        const res = this.moveParticle(nPosition.array, time, this.audio.audioDataAvg)
        const temp = []

        for(let i = 0; i < count; i++) temp.push(...res[i])

        move.array = new Float32Array(temp)
        move.needsUpdate = true
    }
}