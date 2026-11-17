// As tabelas do README, calculadas aqui e em lugar nenhum mais.
//
// Nenhum numero deste projeto e digitado a mao. O medidor imprime o que estas
// funcoes devolvem, o README copia do medidor, e os testes de medidas prendem o
// valor. Se o codigo mudar e o numero mudar, o teste quebra antes do README
// mentir.
//
// Toda tabela passa por `umaVez`: pedir a mesma varredura duas vezes na suite e
// pagar duas vezes foi um erro caro no acervo, e a correcao e esta.

import { grade, inicial, conta, desenha } from './nucleo.js'
import { Motor, varreTudo, varreCheias } from './busca.js'
import { MotorBurro, MotorDaSoma, provaDaSoma, somaEhZero } from './juiz.js'
import { trocaCores } from './nucleo.js'

const guardadas = new Map()
function umaVez (chave, fn) {
  if (!guardadas.has(chave)) guardadas.set(chave, fn())
  return guardadas.get(chave)
}

/** A classe da abertura em xadrez de uma faixa de tabuleiros, com o custo. */
export function aberturas (altura, de, ate) {
  return umaVez(`aberturas:${altura}:${de}:${ate}`, () => {
    const linhas = []
    for (let n = de; n <= ate; n++) {
      const g = grade(n, altura)
      const pos = inicial(g)
      const m = new Motor(g)
      let classe, nos
      try {
        classe = m.classe(pos)
        nos = m.nos
      } catch (e) {
        linhas.push({ n, casas: g.casas, classe: null, nos: null, parou: 'o Map do JS estourou' })
        break
      }
      linhas.push({ n, casas: g.casas, classe, nos, parou: null })
    }
    return linhas
  })
}

/** As quatro classes em TODAS as 3^casas posicoes da grade. */
export function classesDaGrade (w, h) {
  return umaVez(`classes:${w}x${h}`, () => {
    const g = grade(w, h)
    const r = varreTudo(g)
    return { w, h, casas: g.casas, ...r }
  })
}

/** As quatro classes so nas posicoes CHEIAS (2^casas). */
export function classesCheias (w, h) {
  return umaVez(`cheias:${w}x${h}`, () => {
    const g = grade(w, h)
    const r = varreCheias(g)
    return { w, h, casas: g.casas, ...r }
  })
}

/**
 * A tabela CRUZADA das duas reducoes.
 *
 * Uma medida solta de cada otimizacao nao diz nada: o acervo ja viu a ordem que
 * e a melhor com a poda ligada ser a pior sem ela. Aqui as quatro celulas sao
 * medidas, e o que a tabela mostra e se as duas reducoes se somam ou brigam.
 */
export function cruzada (w, h) {
  return umaVez(`cruzada:${w}x${h}`, () => {
    const g = grade(w, h)
    const celulas = {}
    for (const simetria of [false, true]) {
      for (const cores of [false, true]) {
        celulas[`${simetria ? 'sim' : 'nao'}/${cores ? 'sim' : 'nao'}`] = varreTudo(g, { simetria, cores }).nos
      }
    }
    const base = celulas['nao/nao']
    return {
      w, h, celulas,
      ganhoSimetria: base / celulas['sim/nao'],
      ganhoCores: base / celulas['nao/sim'],
      ganhoJuntas: base / celulas['sim/sim'],
      produtoDosGanhos: (base / celulas['sim/nao']) * (base / celulas['nao/sim'])
    }
  })
}

/**
 * A prova da soma, com o controle negativo junto.
 *
 * `espelho` e P + (-P), que a teoria obriga a ser de segundo jogador.
 * `mesma` e P + P, que NAO tem motivo nenhum para ser — e e por isso que ele
 * esta aqui: um juiz que aprova tudo nao e juiz.
 */
export function somaComControle (w, h) {
  return umaVez(`soma:${w}x${h}`, () => {
    const g = grade(w, h)
    const m = new MotorDaSoma(g)
    const total = Math.pow(3, g.casas)
    let espelho = 0, mesma = 0
    for (let n = 0; n < total; n++) {
      let x = n, pretas = 0, brancas = 0
      for (let k = 0; k < g.casas; k++) {
        const d = x % 3; x = (x - d) / 3
        if (d === 1) pretas |= 1 << k
        else if (d === 2) brancas |= 1 << k
      }
      const pos = { pretas, brancas }
      if (somaEhZero(g, pos, m)) espelho++
      if (!m.vence(pos, pos, 0) && !m.vence(pos, pos, 1)) mesma++
    }
    return { w, h, total, espelho, mesma, nos: m.nos }
  })
}

/** O motor bom contra o motor burro, posicao por posicao. */
export function bomContraBurro (w, h) {
  return umaVez(`duelo:${w}x${h}`, () => {
    const g = grade(w, h)
    const bom = new Motor(g)
    const burro = new MotorBurro(g)
    const total = Math.pow(3, g.casas)
    let divergencias = 0
    for (let n = 0; n < total; n++) {
      let x = n, pretas = 0, brancas = 0
      for (let k = 0; k < g.casas; k++) {
        const d = x % 3; x = (x - d) / 3
        if (d === 1) pretas |= 1 << k
        else if (d === 2) brancas |= 1 << k
      }
      const pos = { pretas, brancas }
      if (bom.classe(pos) !== burro.classe(pos)) divergencias++
    }
    return { w, h, total, divergencias, nosBom: bom.nos, nosBurro: burro.nos }
  })
}

/**
 * Onde quem tem MAIS peca perde.
 *
 * Na faixa 1xn de comprimento impar a abertura tem (n+1)/2 pretas contra
 * (n-1)/2 brancas: o preto entra com uma peca a mais. A tabela diz em quais
 * desses tabuleiros essa vantagem de material termina em derrota.
 */
export function maisPecasPerde (ate) {
  return umaVez(`material:${ate}`, () => {
    const linhas = []
    for (let n = 3; n <= ate; n += 2) {
      const g = grade(n, 1)
      const pos = inicial(g)
      const m = new Motor(g)
      const classe = m.classe(pos)
      linhas.push({
        n,
        desenho: desenha(g, pos),
        pretas: conta(pos.pretas),
        brancas: conta(pos.brancas),
        classe,
        pretoPerde: classe === 'R'
      })
    }
    return linhas
  })
}

export { grade, inicial, desenha, trocaCores, provaDaSoma }
