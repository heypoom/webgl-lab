#version 100

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

float rect(in vec2 st, in vec2 size) {
  size = 0.25 - size * 0.25;
  vec2 uv = smoothstep(size, size + size * vec2(0.002), st * (1.0 - st));
  return uv.x * uv.y;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;

  vec3 influenced_color = vec3(0.919, 0.167, 0.465);

  vec3 influencing_color_A = vec3(0.919, 0.167, 0.465);
  vec3 influencing_color_B = vec3(0.928, 0.526, 0.775);

  vec3 color = mix(influencing_color_A, influencing_color_B,
                   step(.5, mix(st.x, st.y, abs(sin(u_time)))));

  color = mix(
      color, influenced_color,
      rect(abs((st - vec2(cos(u_time), .0)) * vec2(2., 1.)), vec2(.05, .125)));

  gl_FragColor = vec4(color, 1);
}