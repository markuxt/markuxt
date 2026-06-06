export default defineAppConfig({
  markuxt: {
    // Navigation items for AppHeader — labelKey references i18n translation keys
    navigation: [
      { to: '/', labelKey: 'nav.home' },
      { to: '/members', labelKey: 'nav.members' },
      { to: '/publications', labelKey: 'nav.publications' },
      { to: '/projects', labelKey: 'nav.projects' },
      { to: '/positions', labelKey: 'nav.positions' },
      { to: '/news', labelKey: 'nav.news' },
    ],

    // Logo image path (served via /_content/ after asset sync)
    logo: {
      src: '/_content/assets/uon-logo.png',
    },

    // Footer contact info
    contact: {
      email: '',
      externalUrl: '',
      externalLabelKey: 'footer.universityLink',
    },

    // Carousel configuration
    carousel: {
      fallbackImage: '/_content/assets/default.jpg',
    },

    // Research areas shown on homepage — titleKey/descKey reference i18n keys
    // icon: name from @icon-park/vue-next (e.g. 'Search', 'Robot', 'Neural', 'AssemblyLine')
    researchAreas: [
      { icon: 'Search', titleKey: 'research.aerospace', descKey: 'research.aerospaceDesc' },
      { icon: 'Robot', titleKey: 'research.robotics', descKey: 'research.roboticsDesc' },
      { icon: 'Neural', titleKey: 'research.intelligent', descKey: 'research.intelligentDesc' },
      { icon: 'AssemblyLine', titleKey: 'research.manufacturing', descKey: 'research.manufacturingDesc' },
    ],
  }
})
