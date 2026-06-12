import Code from '@icon-park/vue-next/es/icons/Code'
import FileCode from '@icon-park/vue-next/es/icons/FileCode'
import Translate from '@icon-park/vue-next/es/icons/Translate'
import Theme from '@icon-park/vue-next/es/icons/Theme'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('IconCode', Code)
  nuxtApp.vueApp.component('IconFileCode', FileCode)
  nuxtApp.vueApp.component('IconTranslate', Translate)
  nuxtApp.vueApp.component('IconTheme', Theme)
})
