// Menú del celular, secuencia de la portada, consulta guiada → WhatsApp, compartir y año del pie.
const WHATSAPP = '5493855854222'
const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches

// ---- menú del celular
const boton = document.querySelector('.hamburguesa')
const menu = document.getElementById('menu')
boton?.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierta')
  boton.setAttribute('aria-expanded', abierto)
  boton.setAttribute('aria-label', abierto ? 'Cerrar el menú' : 'Abrir el menú')
  boton.querySelector('use').setAttribute('href', abierto ? '#i-x' : '#i-menu')
})

// ---- portada: tres verbos que se encienden de a uno, una sola vez (≈12 s) y con pausa.
// Desde el 17/11 hay un solo retrato de Claudio: la foto queda fija y solo hace un zoom lento.
const portada = document.querySelector('.portada[data-secuencia]')
if (portada && !reducir) {
  const fotos = [...portada.querySelectorAll('.fotos img')]
  const pausa = portada.querySelector('.pausa')
  let paso = 0
  let reloj = null

  const mostrar = n => {
    portada.dataset.paso = n
    fotos.forEach((img, i) => {
      const activa = i === Math.min(n, fotos.length) - 1
      img.classList.toggle('activa', activa)
      if (activa) requestAnimationFrame(() => img.classList.add('zoom'))
      else setTimeout(() => img.classList.remove('zoom'), 1400)
    })
  }
  const terminar = () => {
    clearInterval(reloj)
    delete portada.dataset.paso
    fotos.forEach((img, i) => img.classList.toggle('activa', i === 0))
    pausa.hidden = true
  }
  const avanzar = () => {
    paso += 1
    if (paso > fotos.length) return terminar()
    mostrar(paso)
  }

  // las fotos 2 y 3 se piden recién cuando la primera ya se ve
  const arrancar = () => {
    fotos.slice(1).forEach(img => {
      if (img.dataset.srcset) { img.srcset = img.dataset.srcset; img.src = img.dataset.src }
    })
    pausa.hidden = false
    avanzar()
    reloj = setInterval(avanzar, 4000)
  }
  if (fotos[0].complete) arrancar()
  else fotos[0].addEventListener('load', arrancar, { once: true })
  pausa.addEventListener('click', terminar)
}

// ---- propuesta 2: la historia por capítulos (la foto fija cambia con el capítulo que se está leyendo)
document.querySelectorAll('[data-capitulos]').forEach(sec => {
  const figs = sec.querySelectorAll('.historia-fotos figure')
  const puntos = sec.querySelectorAll('.puntos li')
  const obs = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return
      const n = e.target.dataset.n
      figs.forEach(f => f.classList.toggle('activa', f.dataset.n === n))
      puntos.forEach(p => p.classList.toggle('activo', p.dataset.n === n))
    })
  }, { rootMargin: '-45% 0px -45% 0px' })
  sec.querySelectorAll('.historia-textos article').forEach(a => obs.observe(a))
})

// ---- propuesta 3: línea de tiempo (flechas y barra de avance)
document.querySelectorAll('.linea-tiempo').forEach(sec => {
  const lista = sec.querySelector('.hitos')
  const barra = sec.querySelector('.linea-barra span')
  const actualizar = () => {
    const max = lista.scrollWidth - lista.clientWidth
    barra.style.transform = `scaleX(${max > 0 ? 0.15 + 0.85 * lista.scrollLeft / max : 1})`
  }
  lista.addEventListener('scroll', actualizar, { passive: true })
  actualizar()
  let hastaCuando = 0  // el avance automático espera hasta este momento después de que alguien lo usa
  const esperar = ms => { hastaCuando = Date.now() + ms }
  const mover = sentido => {
    const paso = lista.querySelector('.hito').getBoundingClientRect().width + 18
    const max = lista.scrollWidth - lista.clientWidth
    const comportamiento = reducir ? 'auto' : 'smooth'
    // en las puntas da la vuelta, así el carrusel nunca se queda quieto
    if (sentido > 0 && lista.scrollLeft >= max - 4) lista.scrollTo({ left: 0, behavior: comportamiento })
    else if (sentido < 0 && lista.scrollLeft <= 4) lista.scrollTo({ left: max, behavior: comportamiento })
    else lista.scrollBy({ left: paso * sentido, behavior: comportamiento })
  }
  sec.querySelectorAll('[data-desplazar]').forEach(b => b.addEventListener('click', () => { mover(Number(b.dataset.desplazar)); esperar(8000) }))

  // 19/11 (pedido de José): que se mueva solo. Avanza cada 4 s mientras se ve en pantalla.
  // NO se frena por tener el mouse encima (al bajar con la ruedita el puntero cae justo ahí y parecía trabado).
  // Se frena unos segundos solo si alguien lo usa: lo toca, lo arrastra, lo desliza o enfoca un enlace.
  // Botón de pausa para frenarlo del todo (WCAG 2.2.2). Con "reducir movimiento", quieto.
  if (reducir) return
  const pausa = sec.querySelector('[data-pausa-hitos]')
  let visible = false, pausado = false, solo = 0
  setInterval(() => {
    if (!visible || pausado || document.hidden || Date.now() < hastaCuando) return
    solo = Date.now() + 1200  // el desplazamiento que sigue lo hace el carrusel, no la persona
    mover(1)
  }, 4000)
  new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0.35 }).observe(lista)
  lista.addEventListener('pointerdown', () => esperar(8000))
  lista.addEventListener('scroll', () => { if (Date.now() > solo) esperar(8000) }, { passive: true })
  lista.addEventListener('focusin', () => esperar(8000))
  pausa.hidden = false
  pausa.addEventListener('click', () => {
    pausado = !pausado
    pausa.setAttribute('aria-label', pausado ? 'Reanudar el carrusel' : 'Pausar el carrusel')
    pausa.querySelector('use').setAttribute('href', pausado ? '#i-play' : '#i-pause')
  })
})

// ---- consulta guiada → WhatsApp
document.querySelectorAll('form.formulario').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault()
    const falta = form.querySelector('.falta')
    const lineas = []
    const vacios = []

    form.querySelectorAll('[data-etiqueta]').forEach(campo => {
      const etiqueta = campo.dataset.etiqueta
      const valor = campo.classList.contains('opciones')
        ? [...campo.querySelectorAll('input:checked')].map(i => i.value).join(', ')
        : campo.value.trim()
      if (!valor && campo.dataset.obligatorio === 'si') vacios.push(etiqueta.toLowerCase())
      if (valor) lineas.push(`• ${etiqueta}: ${valor}`)
    })

    if (vacios.length) {
      falta.textContent = `Falta completar: ${vacios.join(', ')}.`
      falta.hidden = false
      return
    }
    falta.hidden = true
    const mensaje = `Hola, Claudio. Te escribo desde tu página. Quiero consultar por *${form.dataset.servicio}*.\n\n${lineas.join('\n')}`
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener')
  })
})

// ---- compartir la página
document.querySelectorAll('[data-compartir]').forEach(b => {
  b.addEventListener('click', async () => {
    const datos = { title: document.title, url: location.href }
    if (navigator.share) {
      try { await navigator.share(datos) } catch { /* la persona cerró el menú */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${datos.title} ${datos.url}`)}`, '_blank', 'noopener')
    }
  })
})

document.querySelectorAll('.anio').forEach(el => { el.textContent = new Date().getFullYear() })
