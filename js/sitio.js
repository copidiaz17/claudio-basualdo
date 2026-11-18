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
