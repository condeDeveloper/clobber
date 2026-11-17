// A pagina: um Clobber jogavel, com o motor da mesma pasta decidindo quem ganha.
//
// Nada aqui calcula regra por conta propria: as jogadas vem de `jogadas()` e a
// classe da posicao vem do `Motor`. Se a pagina e o README discordarem, e porque
// alguem reescreveu a regra em dois lugares, e isso e exatamente o que este
// arquivo evita.

import { PRETO, BRANCO, grade, inicial, jogadas, aplica, desenha, conta, pecas } from './nucleo.js'
import { Motor } from './busca.js'

const elTab = document.getElementById('tabuleiro')
const elEstado = document.getElementById('estado')
const elTamanho = document.getElementById('tamanho')
const elVez = document.getElementById('vez')

let g, pos, vez, escolhida, historico

function comeca () {
  const [w, h] = elTamanho.value.split('x').map(Number)
  g = grade(w, h)
  pos = inicial(g)
  vez = PRETO
  escolhida = null
  historico = []
  desenhaTudo()
}

function minhasJogadas () {
  return jogadas(g, pos, vez)
}

function desenhaTudo () {
  elTab.style.gridTemplateColumns = `repeat(${g.largura}, 1fr)`
  elTab.innerHTML = ''
  const possiveis = minhasJogadas()
  const origens = new Set(possiveis.map((j) => j.de))
  const destinos = escolhida === null ? new Set() : new Set(possiveis.filter((j) => j.de === escolhida).map((j) => j.para))
  for (let k = 0; k < g.casas; k++) {
    const b = 1 << k
    const casa = document.createElement('button')
    casa.type = 'button'
    casa.className = 'casa'
    if (pos.pretas & b) casa.classList.add('preta')
    else if (pos.brancas & b) casa.classList.add('branca')
    else casa.classList.add('vazia')
    if (k === escolhida) casa.classList.add('escolhida')
    if (origens.has(k) && escolhida === null) casa.classList.add('pode')
    if (destinos.has(k)) casa.classList.add('alvo')
    casa.setAttribute('aria-label', `casa ${k + 1}`)
    casa.addEventListener('click', () => clique(k, destinos))
    elTab.appendChild(casa)
  }
  if (elVez) elVez.textContent = vez === PRETO ? 'pretas' : 'brancas'
  conta_e_diz(possiveis)
}

function clique (k, destinos) {
  if (destinos.has(k) && escolhida !== null) {
    historico.push({ pos, vez })
    pos = aplica(pos, vez, { de: escolhida, para: k })
    vez = 1 - vez
    escolhida = null
    desenhaTudo()
    return
  }
  const possiveis = minhasJogadas()
  if (possiveis.some((j) => j.de === k)) escolhida = (escolhida === k ? null : k)
  else escolhida = null
  desenhaTudo()
}

function conta_e_diz (possiveis) {
  const quem = vez === PRETO ? 'pretas' : 'brancas'
  if (possiveis.length === 0) {
    const ganhou = vez === PRETO ? 'brancas' : 'pretas'
    elEstado.textContent = `As ${quem} nao tem jogada. Ganham as ${ganhou}.`
    return
  }
  elEstado.textContent = `Vez das ${quem}: ${possiveis.length} jogada${possiveis.length === 1 ? '' : 's'} possivel${possiveis.length === 1 ? '' : 'eis'}. ${pecas(pos)} pecas no tabuleiro.`
}

document.getElementById('reiniciar').addEventListener('click', comeca)
elTamanho.addEventListener('change', comeca)

document.getElementById('voltar').addEventListener('click', () => {
  const ultimo = historico.pop()
  if (!ultimo) return
  pos = ultimo.pos
  vez = ultimo.vez
  escolhida = null
  desenhaTudo()
})

document.getElementById('quem').addEventListener('click', () => {
  const m = new Motor(g)
  const antes = performance.now()
  let classe
  try { classe = m.classe(pos) } catch (e) {
    elEstado.textContent = 'Este tabuleiro passa do que o navegador aguenta guardar.'
    return
  }
  const ms = Math.round(performance.now() - antes)
  const texto = {
    N: 'ganha quem joga agora',
    P: 'ganha quem joga por ultimo',
    L: 'ganham as pretas, jogue quem jogar',
    R: 'ganham as brancas, jogue quem jogar'
  }[classe]
  elEstado.textContent = `${classe}: ${texto}. ${m.nos.toLocaleString('pt-BR')} posicoes abertas em ${ms} ms.`
})

comeca()
