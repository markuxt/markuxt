import { h, defineComponent } from 'vue'

/**
 * KaTeX renders math as HTML + MathML.  The MathML tags (<mi>, <mrow>, …)
 * appear as PascalCase in MDC's rendered output (Mi, Mrow …).  Vue tries to
 * resolve them as components and warns when it can't.
 *
 * This plugin registers stub components that render the native MathML element
 * with its children, suppressing the warnings while preserving accessibility
 * (screen readers can still access the MathML tree).
 */
const mathMLTags = [
  'math', 'mi', 'mrow', 'msub', 'msup', 'msubsup', 'mo', 'mn', 'mtext',
  'mfrac', 'mspace', 'mstyle', 'mpadded', 'mphantom', 'menclose', 'munder',
  'mover', 'munderover', 'mmultiscripts', 'mtable', 'mtr', 'mtd', 'maction',
  'annotation', 'semantics', 'annotation-xml', 'msqrt', 'mroot', 'mfenced',
  'ms', 'mprescripts'
]

export default defineNuxtPlugin((nuxtApp) => {
  for (const tag of mathMLTags) {
    const pascal = tag.charAt(0).toUpperCase() + tag.slice(1)
    // PascalCase component renders native lowercase element
    const component = defineComponent({
      name: pascal,
      inheritAttrs: true,
      setup(_, { attrs, slots }) {
        return () => h(tag, attrs, slots.default?.())
      }
    })
    nuxtApp.vueApp.component(pascal, component)
  }
})
