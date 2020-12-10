import { getGlobals } from './getGlobals'

export type ShaderType = 'vertex' | 'fragment'

type TaggedTemplateLiteral<T = string> = (
  s: TemplateStringsArray,
  ...keys: string[]
) => T

const tagged = <T>(cb: (s: string) => T): TaggedTemplateLiteral<T> => (
  s,
  ...keys
) => cb(s.map((ss, i) => ss + (keys[i] || '')).join(''))

const { canvas, gl, shaderTypeMap, program, currentShader } = getGlobals()

let currentStrHash = 0

function strHash(str: string): number {
  if (str.length == 0) return 0

  let hash = 0

  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash = hash & hash
  }

  return hash
}

window.addEventListener('resize', () => {
  const canvas = document.querySelector('canvas')!

  canvas.width = window.innerWidth * window.devicePixelRatio
  canvas.height = window.innerHeight * window.devicePixelRatio
})

function createShader(type: ShaderType, source: string): WebGLShader {
  const glType = shaderTypeMap[type]
  const shader = gl.createShader(glType)!

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  gl.attachShader(program, shader)

  currentShader[type] = shader

  console.log(`Shader(${type}): loaded.`)

  return shader
}

function setupVertex(): number {
  // Vertices
  const dim = 2

  const vertices = new Float32Array([
    // First triangle:
    1.0,
    1.0,
    -1.0,
    1.0,
    -1.0,
    -1.0,

    // Second triangle:
    -1.0,
    -1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
  ])

  // Create a buffer object
  const vertexBuffer = gl.createBuffer()
  if (!vertexBuffer) return 0

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  const a_Position = gl.getAttribLocation(program, 'a_Position')
  if (a_Position < 0) return 0

  gl.vertexAttribPointer(a_Position, dim, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(a_Position)

  return vertices.length / dim
}

async function main() {
  const vert = tagged((s) => createShader('vertex', s))
  const frag = tagged((s) => createShader('fragment', s))

  vert`
    #version 100

    attribute vec4 a_Position;

    void main() {
        gl_Position = a_Position;
    }
  `

  await resyncFragmentShader()

  gl.linkProgram(program)

  const vertexCount = setupVertex()

  gl.useProgram(program)

  const uniform = {
    ref: (name: string) => gl.getUniformLocation(program, name)!,

    /** Float */
    f(name: string, value: number) {
      gl.uniform1f(this.ref(name), value)
    },

    /** Vec2(Float) */
    v2f(name: string, value: [number, number]) {
      gl.uniform2fv(this.ref(name), value)
    },
  }

  function render(time: number) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    uniform.f('u_time', time / 1000)
    uniform.v2f('u_resolution', [canvas?.width ?? 0, canvas?.height ?? 0])

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount)

    window.requestAnimationFrame(render)
  }

  window.requestAnimationFrame(render)
}

async function resyncFragmentShader(path = 'http://localhost:5000/hello.frag') {
  const src = await fetch(path).then((t) => t.text())

  const hash = strHash(src)
  if (hash === currentStrHash) return

  currentStrHash = hash

  const activeShader = currentShader.fragment
  if (activeShader) gl.detachShader(program, activeShader)

  console.log('Re-injecting Shader...')

  createShader('fragment', src)

  gl.linkProgram(program)
}

// @ts-ignore
window.resyncFragmentShader = resyncFragmentShader

console.log('cool!')

setInterval(() => {
  resyncFragmentShader()
}, 400)

main()

if (import.meta.hot) {
  import.meta.hot.accept(({ module }) => {
    console.log('Accept!')
  })

  import.meta.hot.dispose(() => {
    console.log('Dispose!')
  })
}
