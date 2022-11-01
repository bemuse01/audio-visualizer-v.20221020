import ShadeMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute vec2 move;

        uniform float pointSize;
        uniform float audioData;
        uniform float time;

        ${ShadeMethod.snoise3D()}

        const float boost = 0.015;

        void main(){
            vec3 nPosition = position;

            // float r = snoise3D(vec3(position.xy * boost, time * 0.001)) * audioData;
            // float n = r * 5.0;

            nPosition.xy += move;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);
            gl_PointSize = pointSize;
        }
    `,
    fragment: `
        uniform float opacity;

        void main(){
            float f = distance(gl_PointCoord, vec2(0.5));

            if(f > 0.5){
                discard;
            }

            gl_FragColor = vec4(1.0, 1.0, 1.0, opacity);
        }
    `
}