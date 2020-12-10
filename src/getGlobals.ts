import type { ShaderType } from './main'

interface IContext {
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  program: WebGLProgram

  shaderTypeMap: Record<ShaderType, GLenum>
  currentShader: Partial<Record<ShaderType, WebGLShader>>
}

type Maybe<T> = T | null | undefined
type Nullable<T> = { [K in keyof T]: T[K] | null }

export const context: Nullable<IContext> = {
  canvas: null,
  gl: null,
  program: null,
  shaderTypeMap: null,
  currentShader: null,
}

export function getGlobals(): IContext {
  function def<K extends keyof IContext>(k: K, cb: () => Maybe<IContext[K]>) {
    if (context[k]) return

    const value = cb()
    if (!value) return

    context[k] = value
  }

  def('canvas', () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return null

    canvas.width = window.innerWidth * window.devicePixelRatio
    canvas.height = window.innerHeight * window.devicePixelRatio

    return canvas
  })

  def('gl', () => context.canvas?.getContext('webgl2'))

  def('shaderTypeMap', () => ({
    vertex: context.gl!.VERTEX_SHADER,
    fragment: context.gl!.FRAGMENT_SHADER,
  }))

  def('program', () => context.gl!.createProgram())

  def('currentShader', () => ({}))

  return context as IContext
}
