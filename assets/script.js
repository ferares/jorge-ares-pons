const nav = {
  menu: undefined,
  toggler: undefined,
  init() {
    nav.toggler = document.querySelector('[js-nav-toggle]')
    if (!nav.toggler) return
    const target = nav.toggler.getAttribute('js-nav-toggle')
    nav.menu = document.querySelector(`[js-nav="${target}"]`)
    nav.toggler.addEventListener('click', nav.toggle)
    nav.menu.addEventListener('click', nav.close)
    nav.menu.querySelector('[js-nav-content]').addEventListener('click', (event) => event.stopPropagation())
  },
  handleKeyDown(event) {
    if (event.key === 'Escape') nav.close()
  },
  open() {
    nav.toggler.setAttribute('aria-expanded', true)
    nav.toggler.classList.add('open')
    nav.menu.classList.add('open')
    document.body.style.overflowY = 'hidden'
    document.addEventListener('keydown', nav.handleKeyDown)
  },  
  close() {
    nav.toggler.setAttribute('aria-expanded', false)
    nav.toggler.classList.remove('open')
    nav.menu.classList.remove('open')
    document.body.style.overflowY = 'auto'
    document.removeEventListener('keydown', nav.handleKeyDown)
  },  
  toggle() {
    if (nav.toggler.classList.contains('open')) nav.close()
    else nav.open()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  nav.init()
})