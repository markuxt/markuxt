import Search from '@icon-park/vue-next/es/icons/Search'
import Robot from '@icon-park/vue-next/es/icons/Robot'
import Neural from '@icon-park/vue-next/es/icons/Neural'
import AssemblyLine from '@icon-park/vue-next/es/icons/AssemblyLine'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('IconSearch', Search)
  nuxtApp.vueApp.component('IconRobot', Robot)
  nuxtApp.vueApp.component('IconNeural', Neural)
  nuxtApp.vueApp.component('IconAssemblyLine', AssemblyLine)
})
