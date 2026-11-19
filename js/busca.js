// Quem ganha. A busca, a memoria e as varreduras.
//
// Clobber e um jogo PARTIDARIO: as pretas so mexem peca preta e as brancas so
// mexem peca branca, entao os dois lados nao tem as mesmas jogadas. Isso muda o
// que da para perguntar. Em jogo imparcial basta saber se a posicao e ganha ou
// perdida para quem joga; aqui preciso de DUAS respostas, uma para cada lado
// comecando, e o par das duas da a classe da posicao:
//
//   N  os dois ganham comecando        -> ganha quem joga primeiro
//   P  nenhum ganha comecando          -> ganha quem joga por ultimo
//   L  so o preto ganha comecando, e o branco comecando tambem perde -> preto ganha sempre
//   R  o espelho de L: branco ganha sempre
//
// A busca e um "existe jogada que deixa o adversario perdido", com memoria
// indexada pela posicao mais de quem e a vez.

import { PRETO, BRANCO, jogadas, temJogada, aplica, trocaCores, chave, componentes, conta } from './nucleo.js'

/**
 * O motor.
 *
 * `simetria` liga a reducao por simetria do tabuleiro (as imagens do retangulo).
 * `cores` liga a reducao por troca de cores, que vale pela propria regra do
 * jogo: trocar as cores e trocar os papeis, entao
 *     vence(pos, PRETO) === vence(trocaCores(pos), BRANCO).
 * As duas sao INDEPENDENTES, e e por isso que a tabela do README mede as quatro
 * combinacoes em vez de duas medidas soltas.
 */
export class Motor {
  constructor (g, opcoes = {}) {
    this.g = g
    this.simetria = opcoes.simetria !== false
    this.cores = opcoes.cores !== false
    this.memoria = new Map()
    this.nos = 0
    this.batidas = 0
    this.imagens = montaImagens(g)
  }

  zera () { this.memoria.clear(); this.nos = 0; this.batidas = 0 }

  /** A chave canonica: a menor entre as imagens permitidas. */
  canonica (pos, quem) {
    let melhorP = pos.pretas >>> 0
    let melhorB = pos.brancas >>> 0
    let melhorQ = quem
    const candidatos = this.cores
      ? [[pos, quem], [trocaCores(pos), 1 - quem]]
      : [[pos, quem]]
    let primeiro = true
    for (const [p, q] of candidatos) {
      const formas = this.simetria ? this.imagens : [null]
      for (const f of formas) {
        const pp = f ? espalha(p.pretas, f) : (p.pretas >>> 0)
        const bb = f ? espalha(p.brancas, f) : (p.brancas >>> 0)
        if (primeiro || pp < melhorP || (pp === melhorP && bb < melhorB) ||
            (pp === melhorP && bb === melhorB && q < melhorQ)) {
          melhorP = pp; melhorB = bb; melhorQ = q; primeiro = false
        }
      }
    }
    return chave({ pretas: melhorP, brancas: melhorB }, melhorQ, this.g.casas)
  }

  /** `quem` esta na vez: ele ganha? */
  vence (pos, quem) {
    const k = this.canonica(pos, quem)
    const guardado = this.memoria.get(k)
    if (guardado !== undefined) { this.batidas++; return guardado }
    this.nos++
    let resposta = false
    for (const j of jogadas(this.g, pos, quem)) {
      if (!this.vence(aplica(pos, quem, j), 1 - quem)) { resposta = true; break }
    }
    this.memoria.set(k, resposta)
    return resposta
  }

  /** A classe da posicao: 'N', 'P', 'L' ou 'R'. */
  classe (pos) {
    const p = this.vence(pos, PRETO)
    const b = this.vence(pos, BRANCO)
    if (p && b) return 'N'
    if (!p && !b) return 'P'
    return p ? 'L' : 'R'
  }
}

/** As imagens do retangulo: 4 num retangulo qualquer, 8 num quadrado. */
export function montaImagens (g) {
  const { largura: w, altura: h, casas } = g
  const mapas = []
  const quadrado = w === h
  const transformacoes = [
    (r, c) => [r, c],
    (r, c) => [r, w - 1 - c],
    (r, c) => [h - 1 - r, c],
    (r, c) => [h - 1 - r, w - 1 - c]
  ]
  if (quadrado) {
    transformacoes.push(
      (r, c) => [c, r],
      (r, c) => [c, h - 1 - r],
      (r, c) => [w - 1 - c, r],
      (r, c) => [w - 1 - c, h - 1 - r]
    )
  }
  for (const t of transformacoes) {
    const para = new Int32Array(casas)
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const [r2, c2] = t(r, c)
        para[r * w + c] = r2 * (quadrado ? h : w) + c2
      }
    }
    mapas.push(para)
  }
  return mapas
}

/** Leva a mascara por um mapa de casas. */
export function espalha (m, mapa) {
  let saida = 0
  let resto = m
  while (resto) {
    const b = resto & -resto
    const k = Math.log2(b >>> 0) | 0
    saida |= 1 << mapa[k]
    resto ^= b
  }
  return saida >>> 0
}

/**
 * Varre TODAS as 3^casas distribuicoes de pecas da grade e conta as classes.
 *
 * Nao e amostra: cada casa e vazia, preta ou branca, e as tres combinam
 * livremente. A posicao vazia entra: ela e P, ninguem tem jogada.
 */
export function varreTudo (g, opcoes = {}) {
  const motor = new Motor(g, opcoes)
  const contagem = { N: 0, P: 0, L: 0, R: 0 }
  const total = Math.pow(3, g.casas)
  for (let n = 0; n < total; n++) {
    let x = n, pretas = 0, brancas = 0
    for (let k = 0; k < g.casas; k++) {
      const d = x % 3; x = (x - d) / 3
      if (d === 1) pretas |= 1 << k
      else if (d === 2) brancas |= 1 << k
    }
    contagem[motor.classe({ pretas, brancas })]++
  }
  return { contagem, total, nos: motor.nos, batidas: motor.batidas, guardadas: motor.memoria.size }
}

/**
 * So as posicoes CHEIAS: nenhuma casa vazia, cada casa preta ou branca.
 *
 * Sao as posicoes de abertura possiveis, 2^casas delas. A abertura de verdade
 * do jogo (o xadrez) e uma destas duas mil e tantas.
 */
export function varreCheias (g, opcoes = {}) {
  const motor = new Motor(g, opcoes)
  const contagem = { N: 0, P: 0, L: 0, R: 0 }
  const total = 1 << g.casas
  for (let pretas = 0; pretas < total; pretas++) {
    const brancas = (~pretas) & g.todas
    contagem[motor.classe({ pretas, brancas })]++
  }
  return { contagem, total, nos: motor.nos, batidas: motor.batidas, guardadas: motor.memoria.size }
}

/** Quantas jogadas a partida dura, no minimo e no maximo, com jogo perfeito. */
export function duracao (g, pos, quem, motor) {
  const m = motor || new Motor(g)
  const vai = m.vence(pos, quem)
  let melhor = null
  const todas = jogadas(g, pos, quem)
  if (todas.length === 0) return 0
  for (const j of todas) {
    const dep = aplica(pos, quem, j)
    const perdeu = !m.vence(dep, 1 - quem)
    if (vai && !perdeu) continue
    const d = 1 + duracao(g, dep, 1 - quem, m)
    if (melhor === null) melhor = d
    else if (vai) melhor = Math.min(melhor, d)
    else melhor = Math.max(melhor, d)
  }
  return melhor === null ? 1 : melhor
}

/** O numero de componentes conexas da abertura em xadrez (sempre 1, e eu conferi). */
export function componentesDa (g, pos) {
  return componentes(g, pos).length
}

export { conta, temJogada }
