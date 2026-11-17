// O juiz. Decide as mesmas coisas por caminhos que nao passam pela busca.
//
// Sao tres juizes, e eles respondem perguntas diferentes de proposito:
//
// 1. `MotorBurro`  — a mesma pergunta sem memoria, sem simetria e sem troca de
//    cores. Se ele discorda do motor bom, uma das duas reducoes esta errada.
//    Ele nao serve para tabuleiro grande, e a tabela diz ate onde ele chegou.
//
// 2. `somaEhZero`  — a prova pela SOMA. Em teoria dos jogos combinatorios, o
//    negativo de um jogo e o jogo com os papeis trocados, e G + (-G) e sempre
//    uma posicao de segundo jogador. Em Clobber o negativo e literal: trocar as
//    cores do tabuleiro. Entao, para QUALQUER posicao P, jogar em P e na copia
//    de cores trocadas ao mesmo tempo tem de ser vitoria de quem joga por
//    ultimo. Isso nao usa nada da busca de uma posicao so: e uma partida em dois
//    tabuleiros, com busca propria. Quando passa, passa por motivo: quem for o
//    segundo copia no outro tabuleiro a jogada que o primeiro acabou de fazer.
//
// 3. `contasDaPartida` — o que a regra obriga, sem olhar quem ganha: toda
//    jogada tira exatamente uma peca, ninguem joga com peca do outro, e a
//    partida acaba.

import { PRETO, BRANCO, jogadas, aplica, trocaCores, pecas, conta, componentes } from './nucleo.js'

/** A mesma pergunta, no braco: sem memoria e sem reducao nenhuma. */
export class MotorBurro {
  constructor (g) { this.g = g; this.nos = 0 }
  zera () { this.nos = 0 }

  vence (pos, quem) {
    this.nos++
    for (const j of jogadas(this.g, pos, quem)) {
      if (!this.vence(aplica(pos, quem, j), 1 - quem)) return true
    }
    return false
  }

  classe (pos) {
    const p = this.vence(pos, PRETO)
    const b = this.vence(pos, BRANCO)
    if (p && b) return 'N'
    if (!p && !b) return 'P'
    return p ? 'L' : 'R'
  }
}

/**
 * A partida nos DOIS tabuleiros ao mesmo tempo.
 *
 * Quem esta na vez escolhe um dos tabuleiros e joga nele. Quem nao tem jogada em
 * nenhum dos dois perde. E a soma de jogos da teoria, implementada direto.
 */
export class MotorDaSoma {
  constructor (g) { this.g = g; this.memoria = new Map(); this.nos = 0 }
  zera () { this.memoria.clear(); this.nos = 0 }

  vence (a, b, quem) {
    const k = ((a.pretas >>> 0) * 2 + quem) + ':' + (a.brancas >>> 0) + ':' + (b.pretas >>> 0) + ':' + (b.brancas >>> 0)
    const guardado = this.memoria.get(k)
    if (guardado !== undefined) return guardado
    this.nos++
    let resposta = false
    for (const j of jogadas(this.g, a, quem)) {
      if (!this.vence(aplica(a, quem, j), b, 1 - quem)) { resposta = true; break }
    }
    if (!resposta) {
      for (const j of jogadas(this.g, b, quem)) {
        if (!this.vence(a, aplica(b, quem, j), 1 - quem)) { resposta = true; break }
      }
    }
    this.memoria.set(k, resposta)
    return resposta
  }
}

/**
 * P + (-P) e de segundo jogador?
 *
 * Devolve true quando NENHUM dos dois ganha comecando, que e a definicao de
 * posicao de segundo jogador. E o teste que o acervo chamaria de "prova do
 * espelho": nao calculo valor de jogo nenhum, eu JOGO a soma inteira.
 */
export function somaEhZero (g, pos, motor) {
  const m = motor || new MotorDaSoma(g)
  const espelho = trocaCores(pos)
  return !m.vence(pos, espelho, PRETO) && !m.vence(pos, espelho, BRANCO)
}

/** Roda a prova da soma em TODAS as posicoes da grade. */
export function provaDaSoma (g, limite = Infinity) {
  const m = new MotorDaSoma(g)
  const total = Math.min(Math.pow(3, g.casas), limite)
  let ok = 0
  for (let n = 0; n < total; n++) {
    let x = n, pretas = 0, brancas = 0
    for (let k = 0; k < g.casas; k++) {
      const d = x % 3; x = (x - d) / 3
      if (d === 1) pretas |= 1 << k
      else if (d === 2) brancas |= 1 << k
    }
    if (somaEhZero(g, { pretas, brancas }, m)) ok++
    else return { ok, total, falhou: { pretas, brancas }, nos: m.nos }
  }
  return { ok, total, falhou: null, nos: m.nos }
}

/**
 * As contas que a regra obriga, conferidas jogada a jogada numa partida.
 *
 * - toda jogada tira exatamente uma peca do tabuleiro;
 * - quem joga nunca perde peca propria (a dele anda, a do outro some);
 * - o numero de jogadas de uma partida inteira e no maximo pecas - 1.
 */
export function contasDaPartida (g, pos, quem) {
  let atual = pos
  let vez = quem
  let feitas = 0
  const comeco = pecas(atual)
  while (true) {
    const possiveis = jogadas(g, atual, vez)
    if (possiveis.length === 0) break
    const antes = pecas(atual)
    const minhasAntes = conta(vez === PRETO ? atual.pretas : atual.brancas)
    const j = possiveis[(feitas * 7 + 3) % possiveis.length]
    atual = aplica(atual, vez, j)
    const depois = pecas(atual)
    const minhasDepois = conta(vez === PRETO ? atual.pretas : atual.brancas)
    if (depois !== antes - 1) return { ok: false, porque: 'a jogada nao tirou exatamente uma peca', feitas }
    if (minhasDepois !== minhasAntes) return { ok: false, porque: 'quem jogou perdeu ou ganhou peca propria', feitas }
    feitas++
    vez = 1 - vez
    if (feitas > comeco) return { ok: false, porque: 'passou do teto de jogadas', feitas }
  }
  return { ok: true, feitas, comeco, teto: comeco - 1 }
}

/**
 * Previsao barata, sem busca: posicao em que CADA componente conexa tem uma peca
 * so e de segundo jogador, porque ninguem tem jogada nenhuma.
 */
export function previsaoDasSolitarias (g, pos) {
  for (const c of componentes(g, pos)) if (conta(c) > 1) return null
  return 'P'
}

export { PRETO, BRANCO }
